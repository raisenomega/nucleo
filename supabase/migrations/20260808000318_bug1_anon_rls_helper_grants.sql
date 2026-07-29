-- BUG 1 (bloqueo total de ventas del landing): la migr 309 (anon-hardening) hizo
-- `revoke execute on all functions in schema public from anon` y su whitelist de re-grant
-- solo cubrió funciones `^_public` / `^get_public`. Los HELPERS de RLS quedaron sin grant.
--
-- Efecto: en tablas anon-legibles con políticas permisivas combinadas por OR
-- (una pública + una CEO/admin), Postgres evalúa la rama CEO al no poder cortocircuitar
-- el OR (cuando el USING de la pública no es constante) → llama al helper → 42501
-- "permission denied for function ...". Ej: un `select` anon sobre tenant_order_forms
-- reventaba, y el flujo de compra del landing (resolveForm) devolvía null → "notfound".
--
-- Auditoría (sobre 168 tablas con SELECT para anon): current_tenant=242 refs en policies,
-- can_access_module=72, is_ceo_or_above=65, is_superadmin=32. Los 4 devuelven valores
-- SEGUROS para anon (leen el JWT → null/'' → null/false) y solo miran auth.uid() del
-- propio caller: no exponen datos de otros tenants. Re-otorgarlos restaura el comportamiento
-- previo a 309 (el helper evalúa inofensivo dentro del OR de la policy).
--
-- Gotcha para el futuro: verificar EXECUTE anon de los helpers ANTES de crear policies
-- OR (pública + rol) en tablas anon-legibles. Ver memoria [[migr-309-anon-hardening-helpers]].

grant execute on function public.current_tenant() to anon;
grant execute on function public.is_ceo_or_above() to anon;
grant execute on function public.is_superadmin() to anon;
grant execute on function public.can_access_module(text, text) to anon;
