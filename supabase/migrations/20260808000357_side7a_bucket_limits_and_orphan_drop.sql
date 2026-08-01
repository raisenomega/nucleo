-- SIDE-7 (a) · Dos cierres autocontenidos de la auditoría E2E 2026-08-01.

-- ---------------------------------------------------------------------------------------------------
-- A1 · Límites en el bucket applicant-docs (hallazgo §20).
--
-- ESTADO ACTUAL VERIFICADO: bucket privado, `file_size_limit` NULL y `allowed_mime_types` NULL — es decir,
-- sin ningún límite. La policy `applicant_docs_anon_insert` permite INSERT a anon y authenticated, acotado
-- a que la ruta corresponda a un candidato existente ({tenant_id}/{applicant_id}/...). Ese acotamiento
-- impide subir a carpetas ajenas, pero NO limita ni el tamaño ni el tipo: un anónimo con el uuid de un
-- candidato podía subir un ejecutable de 2 GB.
--
-- Se corrige a nivel de bucket, que es donde Supabase lo aplica de forma nativa, en vez de complicar la
-- policy. Precedente en este mismo proyecto: `marketing-media` ya usa las dos columnas.
--
-- RIESGO DE ROTURA: nulo. El bucket está VACÍO (0 objetos), así que ningún fichero existente queda fuera
-- de la nueva whitelist. El flujo del candidato no cambia: sigue subiendo sin login.
update storage.buckets
   set file_size_limit = 10485760,   -- 10 MB
       allowed_mime_types = array[
         'application/pdf',
         'image/jpeg', 'image/png', 'image/webp',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
       ]
 where id = 'applicant-docs';

-- ---------------------------------------------------------------------------------------------------
-- A2 · DROP de set_my_pin(text), huérfana confirmada.
--
-- CADENA DE VERIFICACIÓN (no se borra una función por corazonada):
--   · SIDE-6 Fase 1B la pasó por los cinco criterios —policies, cuerpo de otras funciones, triggers,
--     crons y frontend/edge— y dio cero en todos.
--   · SIDE-6 migr 355a la revocó de public/anon/authenticated. Desde entonces nadie la ha podido llamar,
--     y no ha aparecido ninguna rotura.
--   · Re-verificado hoy antes del DROP: sigue sin llamadores (0 funciones, 0 policies, 0 crons).
--
-- Nunca fue un riesgo: su cuerpo era `update profiles set pin_hash=... where id = auth.uid()`, es decir
-- self-scoped. Está huérfana porque el panel usa admin_set_pin (un CEO+ fijando el PIN de otro) y
-- verify_my_pin para comprobarlo. Esas dos, más las del modo demo, quedan intactas.
--
-- La columna profiles.pin_hash NO se toca: la función sólo la actualizaba, no era su dueña. El único
-- perfil con PIN configurado lo conserva.
drop function if exists public.set_my_pin(text);

-- ---------------------------------------------------------------------------------------------------
insert into public.audit_log (tenant_id, action, entity_type, new_values, risk_level)
values (null, 'side7a_bucket_limits_and_orphan_drop', 'security',
  jsonb_build_object(
    'bucket', 'applicant-docs: 10MB + whitelist de 6 mime types (antes: sin limite alguno)',
    'drop', 'set_my_pin(text): huerfana verificada en 5 criterios (SIDE-6 1B), revocada en 355a, re-verificada hoy',
    'intactas', jsonb_build_array('admin_set_pin','verify_my_pin','verify_demo_owner_pin','set_demo_owner_pin'),
    'migration', '20260808000357'),
  'low');
