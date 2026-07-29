// Edge Function: recibe webhooks de Stripe por tenant, valida la firma con el webhook secret
// del tenant (desde Vault vía RPC service_role), guarda el evento (idempotente por stripe_event_id)
// y delega el procesamiento a las RPCs process_checkout_completed / process_refund.
//
// Deploy manual (Jojo):  supabase functions deploy stripe-webhook --no-verify-jwt
// Endpoint por tenant:   https://ultwflbebsdhkphntjkw.supabase.co/functions/v1/stripe-webhook?tenant_id=<TENANT_UUID>
// Eventos a suscribir en Stripe: checkout.session.completed, charge.refunded, charge.dispute.created
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  // Persistir + idempotencia (unique stripe_event_id).
  const { error: insErr } = await supabase.from("stripe_webhook_events")
    .insert({ tenant_id: tenantId, stripe_event_id: event.id, event_type: event.type, payload: event });
  if (insErr?.code === "23505") return new Response("Already processed", { status: 200 });

  try {
    if (event.type === "checkout.session.completed")
      await supabase.rpc("process_checkout_completed", { p_tenant_id: tenantId, p_session: event.data.object });
    else if (event.type === "charge.refunded")
      await supabase.rpc("process_refund", { p_tenant_id: tenantId, p_charge: event.data.object });
    await supabase.from("stripe_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() }).eq("stripe_event_id", event.id);
  } catch (e) {
    await supabase.from("stripe_webhook_events")
      .update({ processing_error: String(e) }).eq("stripe_event_id", event.id);
  }
  return new Response("OK", { status: 200 });
});
