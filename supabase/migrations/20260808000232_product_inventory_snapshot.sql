-- 232 · Ola 2.3b · Snapshot de inventario de un producto (para el drill-down factura→línea→SKU→stock).
--
-- Dado un product_id del catálogo, resuelve su inventory_item enlazado (landing_product_id) y devuelve stock +
-- métricas + los campos necesarios para reusar los modales de restock/ajuste. Gate inventory:view (RLS de
-- inventory_items es solo-tenant → sin este gate, un usuario de billing sin inventory:view vería stock). Los
-- costos (avg_cost/unit_cost/stock_value) se ocultan sin inventory:cost. Solo lectura; no toca nada.

create or replace function public.get_product_inventory_snapshot(_product_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare _t uuid := current_tenant(); _cost boolean := public.can_access_module('inventory','cost'); _r jsonb;
begin
  if not public.can_access_module('inventory','view') then raise exception 'NOT_AUTHORIZED'; end if;
  select jsonb_build_object(
    'linked', true, 'id', ii.id, 'name', ii.name, 'sku', ii.sku, 'stock', ii.stock,
    'min_stock', ii.min_stock, 'supplier_name', ii.supplier_name, 'supplier_id', ii.supplier_id,
    'landing_product_id', ii.landing_product_id, 'last_restock_date', ii.last_restock_date,
    'warehouse_zone', ii.warehouse_zone, 'aisle', ii.aisle, 'shelf', ii.shelf, 'bin', ii.bin,
    'reorder_point', ii.reorder_point, 'reorder_qty', ii.reorder_qty,
    'is_low', (ii.stock <= coalesce(ii.min_stock, 0)),
    'unit_cost', case when _cost then ii.unit_cost else null end,
    'avg_cost', case when _cost then ii.avg_cost else null end,
    'stock_value', case when _cost then ii.stock * coalesce(ii.avg_cost, ii.unit_cost, 0) else null end
  ) into _r from public.inventory_items ii where ii.landing_product_id = _product_id and ii.tenant_id = _t;
  return coalesce(_r, jsonb_build_object('linked', false));
end $$;
grant execute on function public.get_product_inventory_snapshot(uuid) to authenticated;
