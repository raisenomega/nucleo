import { describe, it, expect } from "vitest";

// El test corre bajo Node (vitest) y el tsconfig de la app es de navegador: se declara sólo lo que se usa.
declare const process: { env: Record<string, string | undefined> };

// Guard de AISLAMIENTO DE TENANT en el webhook de suscripciones (hallazgo b91c3700, cerrado por la migr 363).
//
// process_subscription_event es SECURITY DEFINER, así que la RLS de tenant_landing_orders NO la frena, y el
// order_id con el que busca la orden viene de la metadata de Stripe — dato del emisor del evento, no del
// servidor. Si la lectura no se acota por tenant_id, un evento firmado por el tenant A alcanza la orden del
// tenant B. Lo único que separa los tenants en este camino es ese predicado en el WHERE.
//
// Se verifica contra la definición REAL en prod (pg_get_functiondef), no contra el .sql del repo, porque el
// modo de fallo documentado de este proyecto es justo ese: un `create or replace` regenerado desde una copia
// vieja del source (lección #9 del runbook) que borra el arreglo sin tocar un solo fichero de migraciones.
const FN = "process_subscription_event";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN, REF = process.env.SUPABASE_PROJECT_REF ?? "ultwflbebsdhkphntjkw";

const SQL = `
  select p.proname, pg_get_functiondef(p.oid) as def
  from pg_proc p
  join pg_namespace n on p.pronamespace = n.oid
  where n.nspname = 'public' and p.proname = '${FN}'`;

type Row = { proname: string; def: string };

async function definiciones(): Promise<Row[]> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ query: SQL }),
  });
  if (!res.ok) throw new Error(`Management API ${res.status}: ${await res.text()}`);
  return (await res.json()) as Row[];
}

// Sentencias del cuerpo que tocan la tabla de órdenes buscando por el id que trae el evento.
function sentenciasPorOid(def: string): string[] {
  return def
    .replace(/\s+/g, " ")
    .split(";")
    .filter((s) => s.includes("tenant_landing_orders") && /where\s+id\s*=\s*_oid/.test(s));
}

describe(`aislamiento de tenant en ${FN}`, () => {
  it.skipIf(!TOKEN)("toda lectura y escritura de la orden va acotada al tenant del evento", async () => {
    const filas = await definiciones();

    // Que la función desaparezca o se renombre también es un fallo: el guard dejaría de vigilar en silencio.
    expect(filas.length, `${FN} no existe en public: el guard ya no vigila nada`).toBeGreaterThan(0);

    for (const fila of filas) {
      const sentencias = sentenciasPorOid(fila.def);
      expect(
        sentencias.length,
        `${FN} ya no busca la orden por _oid: el guard quedó obsoleto, revísalo contra la definición actual`,
      ).toBeGreaterThan(0);

      const sinAcotar = sentencias.filter((s) => !/tenant_id\s*=\s*p_tenant_id/.test(s));
      expect(
        sinAcotar,
        `Acceso a tenant_landing_orders SIN acotar por tenant en ${FN} (fuga entre tenants):\n  ${sinAcotar.join("\n  ")}`,
      ).toEqual([]);
    }
  });

  it("avisa si el guard no puede ejecutarse", () => {
    if (!TOKEN) console.warn(`[${FN}-tenant-scope] SALTADO: falta SUPABASE_ACCESS_TOKEN. El guard NO se comprobó.`);
    expect(true).toBe(true);
  });
});
