// Edge Function: recibe webhooks de Stripe por tenant, valida la firma con el webhook secret
// del tenant (desde Vault vía RPC service_role), guarda el evento (idempotente por stripe_event_id)
// y delega el procesamiento a las RPCs process_*.
//
// Deploy manual (Jojo):  supabase functions deploy stripe-webhook --no-verify-jwt
// Endpoint por tenant:   https://ultwflbebsdhkphntjkw.supabase.co/functions/v1/stripe-webhook?tenant_id=<TENANT_UUID>
// Eventos a suscribir en Stripe: checkout.session.completed, charge.refunded,
//   customer.subscription.created/updated/deleted, invoice.payment_succeeded, invoice.payment_failed
//
// SIDE-5 (auditoría E2E 2026-08-01, hallazgos §12 #2/#3/#4). Tres defectos en el mismo camino del dinero:
//  1. El INSERT de idempotencia NUNCA funcionó. `stripe_webhook_events.id` es text PRIMARY KEY NOT NULL
//     sin default y el código no lo enviaba → todo INSERT fallaba con 23502, y como sólo se comprobaba
//     23505 el fallo se descartaba en silencio. Por eso la tabla tenía 0 filas desde su creación: la
//     idempotencia era decorativa y un reintento de Stripe reprocesaba el cobro.
//  2. `await supabase.rpc(...)` NO lanza: supabase-js devuelve { data, error }. El try/catch no podía
//     capturar jamás un error de RPC, así que un fallo de procesamiento pasaba por éxito.
//  3. Se respondía 200 SIEMPRE, incluso tras registrar un error. Stripe interpreta 200 como procesado y
//     NO reintenta → un pago cobrado cuya orden nunca se marca como pagada se perdía para siempre.
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Sb = ReturnType<typeof createClient>;

// Traza de plataforma: que un fallo del webhook deje rastro en la base, no sólo en los logs de Deno.
async function audit(sb: Sb, tenantId: string, action: string, values: Record<string, unknown>, risk = "high") {
  try {
    await sb.from("audit_log").insert({
      tenant_id: tenantId, action, entity_type: "stripe_webhook", new_values: values, risk_level: risk,
    });
  } catch { /* la traza nunca debe tumbar el manejo del evento */ }
}

// Enruta el evento a su RPC. Devuelve el mensaje de error si lo hubo, o null si fue bien.
// Comprueba `error` de forma explícita porque supabase-js no lanza excepciones.
async function process(sb: Sb, tenantId: string, event: Stripe.Event): Promise<string | null> {
  const obj = event.data.object as Record<string, unknown>;
  const call = (fn: string, args: Record<string, unknown>) => sb.rpc(fn, { p_tenant_id: tenantId, ...args });
  let res: { error: { message?: string } | null } | null = null;

  if (event.type === "checkout.session.completed")
    res = await call(obj.mode === "subscription" ? "process_subscription_checkout" : "process_checkout_completed", { p_session: obj });
  else if (event.type === "charge.refunded") res = await call("process_refund", { p_charge: obj });
  else if (event.type.startsWith("customer.subscription.")) res = await call("process_subscription_event", { p_sub: obj });
  else if (event.type === "invoice.payment_succeeded") res = await call("process_recurring_payment", { p_invoice: obj });
  else if (event.type === "invoice.payment_failed") res = await call("process_failed_recurring_payment", { p_invoice: obj });
  else return null; // evento suscrito pero sin handler: no es un fallo, no hay nada que hacer

  return res?.error ? (res.error.message ?? "error desconocido de RPC") : null;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenant_id");
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  if (!tenantId || !sig) return new Response("Bad request", { status: 400 });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: secrets } = await supabase.rpc("get_stripe_secrets_for_webhook", { p_tenant_id: tenantId });
  if (!secrets?.secret_key || !secrets?.webhook_secret) return new Response("Tenant not configured", { status: 400 });

  const stripe = new Stripe(secrets.secret_key, { apiVersion: "2024-06-20" });
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, secrets.webhook_secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // IDEMPOTENCIA REAL. `id` es la PK y ahora se rellena con el id del evento de Stripe; además la migr 353
  // creó un índice único sobre stripe_event_id.
  //
  // El de-duplicado es por PROCESAMIENTO COMPLETADO, no por recepción. Si dedujéramos por recepción, el
  // 500 de más abajo sería inútil: Stripe reintentaría, el INSERT chocaría con 23505 y responderíamos
  // "ya procesado" sin haberlo procesado nunca — justo el agujero que este cambio viene a cerrar.
  // Por eso, ante un duplicado se mira `processed`: si está a true se corta; si está a false es un
  // reintento de algo que falló y hay que volver a intentarlo.
  const { error: insErr } = await supabase.from("stripe_webhook_events")
    .insert({ id: event.id, tenant_id: tenantId, stripe_event_id: event.id, event_type: event.type, payload: event });
  if (insErr) {
    if (insErr.code !== "23505") {
      await audit(supabase, tenantId, "stripe_webhook_insert_failed",
        { stripe_event_id: event.id, event_type: event.type, code: insErr.code, error: insErr.message }, "critical");
      return new Response("Event log failed", { status: 500 });
    }
    const { data: prev } = await supabase.from("stripe_webhook_events")
      .select("processed").eq("id", event.id).maybeSingle();
    if (prev?.processed) return new Response("Already processed", { status: 200 });
    // Reintento de un evento que quedó a medias: se limpia el error previo y se reprocesa.
    await supabase.from("stripe_webhook_events").update({ processing_error: null }).eq("id", event.id);
  }

  let failure: string | null = null;
  try {
    failure = await process(supabase, tenantId, event);
  } catch (e) {
    failure = String(e);
  }

  if (failure) {
    await supabase.from("stripe_webhook_events")
      .update({ processing_error: failure }).eq("id", event.id);
    await audit(supabase, tenantId, "stripe_webhook_processing_failed",
      { stripe_event_id: event.id, event_type: event.type, error: failure }, "critical");
    // 500 a propósito: Stripe reintenta. Antes se devolvía 200 y el cobro se perdía sin rastro.
    // El reintento es seguro porque el evento quedó registrado y el 23505 lo cortará si ya se procesó.
    return new Response("Processing failed", { status: 500 });
  }

  await supabase.from("stripe_webhook_events")
    .update({ processed: true, processed_at: new Date().toISOString() }).eq("id", event.id);
  return new Response("OK", { status: 200 });
});
