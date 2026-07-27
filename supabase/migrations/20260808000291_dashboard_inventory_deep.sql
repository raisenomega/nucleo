-- DASH-2 · Extiende get_inventory_dashboard con datos para la vista profunda de inventario:
-- valor por almacén (para el pie) + lista de bajo stock + lista de lotes por vencer. Todo lo demás
-- de las vistas profundas reusa RPCs existentes (financial/reconciliation/ar_aging/ap_aging/crm/quotes/ops/fleet).
create or replace function public.get_inventory_dashboard()
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare _t uuid := current_tenant();
begin
  if not public.can_access_module('inventory','view') then return '{}'::jsonb; end if;
  return jsonb_build_object(
    'total_items', (select count(*) from public.inventory_items where tenant_id = _t),
    'total_value', (select coalesce(sum(stock * coalesce(avg_cost, unit_cost, 0)), 0) from public.inventory_items where tenant_id = _t),
    'low_stock', (select count(*) from public.inventory_items where tenant_id = _t and min_stock > 0 and stock <= min_stock),
    'expiring_lots', (select count(*) from public.inventory_lots where tenant_id = _t and status = 'available' and expiry_date is not null and expiry_date <= current_date + 30),
    'cogs_month', (select coalesce(sum(coalesce(cogs_total, quantity * coalesce(unit_cost, 0))), 0) from public.inventory_movements
      where tenant_id = _t and movement_type in ('venta_publica','salida') and deleted_at is null and movement_date >= date_trunc('month', current_date)),
    'top_consumed', coalesce((select jsonb_agg(x order by x.qty desc) from (
      select i.name, sum(m.quantity) as qty from public.inventory_movements m join public.inventory_items i on i.id = m.item_id
      where m.tenant_id = _t and m.movement_type in ('venta_publica','salida') and m.deleted_at is null and m.movement_date >= date_trunc('month', current_date)
      group by i.name order by sum(m.quantity) desc limit 5) x), '[]'::jsonb),
    'by_warehouse', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'value', value) order by value desc) from (
      select w.name, round(sum(s.quantity * coalesce(i.avg_cost, i.unit_cost, 0)), 2) as value
      from public.inventory_stock s join public.warehouses w on w.id = s.warehouse_id join public.inventory_items i on i.id = s.item_id
      where s.tenant_id = _t group by w.name) wv), '[]'::jsonb),
    'low_stock_items', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'stock', stock, 'min', min_stock)) from (
      select name, stock, min_stock from public.inventory_items where tenant_id = _t and min_stock > 0 and stock <= min_stock order by (stock - min_stock) limit 20) ls), '[]'::jsonb),
    'expiring_list', coalesce((select jsonb_agg(x) from (
      select jsonb_build_object('name', i.name, 'lot', l.lot_number, 'expiry', l.expiry_date) as x
      from public.inventory_lots l join public.inventory_items i on i.id = l.item_id
      where l.tenant_id = _t and l.status = 'available' and l.expiry_date is not null and l.expiry_date <= current_date + 30
      order by l.expiry_date limit 20) el), '[]'::jsonb));
end $$;
