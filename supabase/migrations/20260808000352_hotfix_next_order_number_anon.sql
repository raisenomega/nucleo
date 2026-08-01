-- HOTFIX · next_order_number(uuid,text) quedó ejecutable por anon al recrearla en la migr 351.
--
-- QUÉ PASÓ: la 351 hace `drop function next_order_number(uuid)` + `create function next_order_number(
-- uuid, text)`. La función NUEVA nació con el bit PUBLIC (`=X/postgres` al frente de su proacl) y anon es
-- miembro de PUBLIC → quedó invocable por REST sin autenticación. Es una ESCRITURA sin auth: cada llamada
-- incrementa tenant_order_counters, así que un anónimo podía inflar a voluntad la numeración de órdenes,
-- facturas, cotizaciones y contratos de cualquier tenant cuyo uuid conociera.
--
-- POR QUÉ NO LO EVITÓ LA 349 — CORRECCIÓN AL REGISTRO: la migr 349 añadió
--   alter default privileges in schema public revoke execute on functions from public, anon;
-- y su mensaje de commit afirma que eso cierra la causa raíz para funciones futuras. ES FALSO EN ESTE
-- PROYECTO. Evidencia empírica de hoy: pg_default_acl para (postgres, public, 'f') SÍ quedó registrado como
-- {postgres=X,authenticated=X,service_role=X} —sin PUBLIC—, y aun así las 8 funciones creadas después
-- (migr 350 y 351) nacieron TODAS con el bit PUBLIC. Las únicas que no acabaron alcanzables por anon son
-- las que llevaban un `revoke ... from public, anon` EXPLÍCITO en su propia migración.
--
-- REGLA OPERATIVA que se deriva de esto, y que sustituye a la confianza en el default privilege:
--   toda función nueva de public que no deba ser pública necesita su `revoke execute ... from public, anon`
--   escrito a mano en la misma migración que la crea. Sin excepciones y sin atajos.

revoke execute on function public.next_order_number(uuid, text) from public, anon;

-- Traza. tenant_id NULL: evento de plataforma.
insert into public.audit_log (tenant_id, action, entity_type, new_values, risk_level)
values (null, 'anon_execute_leak_closed', 'security',
  jsonb_build_object(
    'function', 'next_order_number(uuid,text)',
    'introduced_by', 'migr_351',
    'impact', 'escritura sin auth: inflar tenant_order_counters de cualquier tenant',
    'finding', 'alter default privileges de migr 349 NO evita el bit PUBLIC en funciones nuevas',
    'rule', 'revoke explicito obligatorio en la migracion que crea la funcion',
    'migration', '20260808000352'),
  'high');
