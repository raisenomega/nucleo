import { describe, it, expect } from "vitest";

// El test corre bajo Node (vitest) y el tsconfig de la app es de navegador: se declara sólo lo que se usa.
declare const process: { env: Record<string, string | undefined> };

// Guard de ACLs. Nace del cierre del arco SIDE-6, y de una lección concreta: dentro de una función
// SECURITY DEFINER, `current_user` devuelve el PROPIETARIO y no quien llama, así que un guard escrito
// dentro del cuerpo no puede bloquear a nadie. Lo único que protege a estas funciones es el REVOKE.
//
// Siendo el REVOKE el control, el fallo que hay que vigilar no es la llamada —ya está cerrada— sino que
// alguien devuelva el privilegio. Ha pasado de tres maneras distintas en este proyecto:
//   · un `create or replace` que reinicia la ACL de la función,
//   · el fail-open de los default privileges (las 8 funciones creadas tras la migr 349 nacieron con el
//     bit PUBLIC pese al `alter default privileges`),
//   · un `grant` manual puesto para depurar y olvidado.
// Este test detecta las tres.
//
// PARA AÑADIR UNA FUNCIÓN: mete su nombre en la lista. Sólo funciones que NUNCA deban ser invocables por
// `anon` ni por `authenticated` — si una necesita ser pública, no va aquí, va con prefijo _public_.
const PROHIBIDAS = [
  "_vault_upsert", // escribe en el Vault: ahí viven las secret keys de Stripe de todos los tenants
  "_send_security_email", // destinatario, asunto y HTML arbitrarios = open relay si se abre
  "_send_subscription_acceptance_email", // dispara correo real al cliente y quema acceptance_email_sent_at
  "_notify_tenant_owner",
  "_notify_lead_created",
  "_campaign_confirm_email",
  "_issue_signed_contract", // emite contratos legales
  "create_contract_token", // acuña los tokens de acceso a contratos firmados
  "_rate_hit_ip", // quemar sus cubos deja sin freno a los endpoints públicos
];

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN, REF = process.env.SUPABASE_PROJECT_REF ?? "ultwflbebsdhkphntjkw";

const SQL = `
  select p.proname,
         has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_can_execute
  from pg_proc p
  join pg_namespace n on p.pronamespace = n.oid
  where n.nspname = 'public'
    and p.proname = any(array[${PROHIBIDAS.map((f) => `'${f}'`).join(", ")}])
  order by p.proname`;

type Row = { proname: string; anon_can_execute: boolean; auth_can_execute: boolean };

async function acls(): Promise<Row[]> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ query: SQL }),
  });
  if (!res.ok) throw new Error(`Management API ${res.status}: ${await res.text()}`);
  return (await res.json()) as Row[];
}

describe("ACLs de funciones sensibles", () => {
  it.skipIf(!TOKEN)("ninguna la pueden ejecutar los roles públicos", async () => {
    const filas = await acls();

    // Que la lista quede obsoleta (función renombrada o borrada) también es un fallo: el guard dejaría de
    // vigilar sin que nadie se entere, que es justo el modo de fallo que este arco viene persiguiendo.
    const ausentes = PROHIBIDAS.filter((f) => !filas.some((r) => r.proname === f));
    expect(ausentes, `Funciones de la lista que ya no existen en la base: ${ausentes.join(", ")}`).toEqual([]);

    const abiertas = filas
      .filter((r) => r.anon_can_execute || r.auth_can_execute)
      .map((r) => `${r.proname} (anon=${r.anon_can_execute}, authenticated=${r.auth_can_execute})`);
    expect(abiertas, `Funciones sensibles que recuperaron EXECUTE:\n  ${abiertas.join("\n  ")}`).toEqual([]);
  });

  it("avisa si el guard no puede ejecutarse", () => {
    if (!TOKEN) console.warn("[grants-coverage] SALTADO: falta SUPABASE_ACCESS_TOKEN. Las ACLs NO se comprobaron.");
    expect(true).toBe(true);
  });
});
