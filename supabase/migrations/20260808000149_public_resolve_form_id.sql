-- Migración 149: fix — resolveForm anon no podía leer item.form_id (RLS catálogo = tenant_id=current_tenant(), null en anon).
-- RPC DEFINER que resuelve tenant por hostname + devuelve el form_id del item (o el default). Los forms/fields ya son anon-legibles.
create or replace function public._public_resolve_form_id(_hostname text, _kind text, _item_id uuid)
returns uuid language plpgsql stable security definer set search_path to 'public', 'extensions' as $fn$
declare _t uuid; _fid uuid;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return null; end if;
  if _kind = 'product' then select form_id into _fid from public.tenant_landing_products where id = _item_id and tenant_id = _t;
  elsif _kind = 'service' then select form_id into _fid from public.tenant_landing_services where id = _item_id and tenant_id = _t;
  elsif _kind = 'package' then select form_id into _fid from public.tenant_landing_packages where id = _item_id and tenant_id = _t;
  end if;
  if _fid is null then select id into _fid from public.tenant_order_forms where tenant_id = _t and is_default and is_active limit 1; end if;
  return _fid;
end $fn$;
grant execute on function public._public_resolve_form_id(text, text, uuid) to anon, authenticated;
