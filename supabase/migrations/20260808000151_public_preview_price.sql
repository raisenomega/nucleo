-- Migración 151: preview de precio server-autoritativo para anon. tenant_pricing_rules es CEO-only (sin anon) →
-- el mirror client-side no podía leer las reglas → preview solo base → total_mismatch al submit. Este RPC resuelve
-- tenant por hostname y delega en _public_price_order (misma función que el submit) → client_total == server_total.
create or replace function public._public_preview_price(_hostname text, _items jsonb, _cf jsonb, _coupon text default null, _is_first_cycle boolean default true)
returns jsonb language plpgsql stable security definer set search_path to 'public', 'extensions' as $fn$
declare _t uuid;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('subtotal', 0, 'tax', 0, 'shipping', 0, 'discount', 0, 'total', 0); end if;
  return public._public_price_order(_t, _items, _cf, _coupon, _is_first_cycle);
end $fn$;
grant execute on function public._public_preview_price(text, jsonb, jsonb, text, boolean) to anon, authenticated;
