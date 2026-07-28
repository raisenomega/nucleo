-- ============================================================================
-- FIX S1: re-grant anon en RPCs públicas de marketing/analytics.
--   S1 (migr 309) revocó EXECUTE de anon en TODO public y re-otorgó solo el set
--   `_public_*`/`get_public_*`. Estas 4 usan naming `_marketing_*`/`track_*` → se
--   escaparon del loop y quedaron sin anon → `permission denied` en el sitio público
--   (formulario de lead, reservas, analytics). Son SECURITY DEFINER con su propia
--   lógica (rate-limit / resolución de tenant por host). Ver [[anon-execute-fail-secure]].
-- ============================================================================
grant execute on function public._marketing_create_lead(jsonb) to anon;
grant execute on function public._marketing_create_reservation(jsonb) to anon;
grant execute on function public._marketing_available_slots(date) to anon;
grant execute on function public.track_landing_event(jsonb) to anon;
