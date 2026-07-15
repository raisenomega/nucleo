-- Migración 163: preview admin de páginas de servicio (para que Roy vea páginas INACTIVAS antes de activarlas).
-- RPC DEFINER que exige que el caller (auth.uid()) sea CEO/superadmin del tenant dueño de la página. Sin filtro
-- is_active. anon o no-CEO → null (cero fuga de páginas privadas). El público sigue usando _public_get_service_page.
create or replace function public._admin_get_service_page(_page_id uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $fn$
declare _t uuid; _r jsonb;
begin
  select tenant_id into _t from public.tenant_service_pages where id = _page_id;
  if _t is null then return null; end if;
  if not exists (select 1 from public.user_roles where tenant_id = _t and user_id = auth.uid() and role in ('ceo','superadmin')) then
    return null;
  end if;
  select jsonb_build_object('slug',slug,'hero',hero,'uses',uses,'specs',specs,'faq',faq,'request_form',request_form,'seo',seo,'is_active',is_active)
    into _r from public.tenant_service_pages where id = _page_id;
  return _r;
end $fn$;
grant execute on function public._admin_get_service_page(uuid) to authenticated;
