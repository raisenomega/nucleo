import { describe, it, expect } from "vitest";

// El test corre bajo Node (vitest), pero el tsconfig de la app es de navegador y no trae @types/node.
// Se declara sólo lo que se usa, en vez de añadir la dependencia entera al proyecto.
declare const process: { env: Record<string, string | undefined> };

// Guard permanente de RLS. `anon` conserva grants de tabla en 180 de 183 tablas, así que RLS es el ÚNICO
// control que separa los datos de internet: una tabla que nazca sin RLS queda legible desde fuera.
// Este test convierte esa mitigación en garantía.
//
// Distingue tres situaciones, porque tratarlas igual genera ruido y el ruido mata los guards:
//   · RLS DESACTIVADO            → fallo duro. Es el peligro real.
//   · RLS activo con 0 policies  → deny-all. Es válido para tablas que sólo se tocan vía funciones
//                                  DEFINER o por el rol de servidor, pero exige decisión consciente: van en
//                                  allowlist de abajo y cualquiera nueva rompe el test.
//   · particiones                → heredan las policies del padre al consultarse por él. Se excluyen.
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF ?? "ultwflbebsdhkphntjkw";

// Deny-all deliberado, verificado el 2026-08-01: ninguna se consulta desde el frontend.
const DENY_ALL_ESPERADO = new Set([
  "consultation_requests", "employee_ssn", "rate_limit_public", "stripe_webhook_events",
]);

const SQL = `
  select c.relname as table_name, c.relrowsecurity as rls_enabled,
         count(pol.polname)::int as policy_count
  from pg_class c
  join pg_namespace n on c.relnamespace = n.oid
  left join pg_policy pol on pol.polrelid = c.oid
  where n.nspname = 'public' and c.relkind = 'r' and not c.relispartition
  group by c.relname, c.relrowsecurity
  having not c.relrowsecurity or count(pol.polname) = 0`;

type Row = { table_name: string; rls_enabled: boolean; policy_count: number };

async function sospechosas(): Promise<Row[]> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ query: SQL }),
  });
  if (!res.ok) throw new Error(`Management API ${res.status}: ${await res.text()}`);
  return (await res.json()) as Row[];
}

describe("cobertura de RLS en el esquema public", () => {
  // Sin token no se comprueba nada. Se SALTA de forma ruidosa en vez de pasar en verde: un test que
  // aprueba porque no pudo conectarse es peor que no tenerlo — registra la intención, no el resultado.
  it.skipIf(!TOKEN)("ninguna tabla sin RLS, y el deny-all sólo donde está declarado", async () => {
    const filas = await sospechosas();
    const sinRls = filas.filter((t) => !t.rls_enabled).map((t) => t.table_name);
    expect(sinRls, `Tablas SIN RLS (legibles por anon): ${sinRls.join(", ")}`).toEqual([]);

    const denyAllNuevas = filas
      .filter((t) => t.rls_enabled && !DENY_ALL_ESPERADO.has(t.table_name))
      .map((t) => t.table_name);
    expect(
      denyAllNuevas,
      `Tablas con RLS y CERO policies no declaradas: ${denyAllNuevas.join(", ")}.\n` +
        "Si el deny-all es intencional, añádelas a DENY_ALL_ESPERADO explicando por qué.",
    ).toEqual([]);
  });

  it("avisa si el guard no puede ejecutarse", () => {
    if (!TOKEN) console.warn("[rls-coverage] SALTADO: falta SUPABASE_ACCESS_TOKEN. El guard NO se comprobó.");
    expect(true).toBe(true);
  });
});
