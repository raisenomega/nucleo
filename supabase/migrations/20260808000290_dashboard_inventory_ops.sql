-- DASH-1 · RPCs para el dashboard centro de comando. Reusa los snapshots existentes (financial/reconciliation/
-- crm/ar_aging/ap_aging/monthly_series_for) y añade 2: inventario y operaciones. Gated + tenant-scoped.

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
      group by i.name order by sum(m.quantity) desc limit 5) x), '[]'::jsonb));
end $$;

create or replace function public.get_ops_dashboard()
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare _t uuid := current_tenant();
begin
  if not public.can_access_module('dashboard','view') then return '{}'::jsonb; end if;
  return jsonb_build_object(
    'routes_total', (select count(*) from public.service_routes where tenant_id = _t and route_date = current_date and deleted_at is null),
    'routes_done', (select count(*) from public.service_routes sr where sr.tenant_id = _t and sr.route_date = current_date and sr.deleted_at is null
      and not exists (select 1 from public.route_stops rs where rs.route_id = sr.id and rs.deleted_at is null and rs.status not like 'Completad%')),
    'stops_total', (select count(*) from public.route_stops rs join public.service_routes sr on sr.id = rs.route_id
      where sr.tenant_id = _t and sr.route_date = current_date and rs.deleted_at is null),
    'stops_done', (select count(*) from public.route_stops rs join public.service_routes sr on sr.id = rs.route_id
      where sr.tenant_id = _t and sr.route_date = current_date and rs.deleted_at is null and rs.status like 'Completad%'),
    'fleet_in_service', (select count(*) from public.tenant_assets where tenant_id = _t and gps_enabled and status = 'in_use'),
    'geofence_events_today', (select count(*) from public.geofence_events where tenant_id = _t and recorded_at::date = current_date),
    'maint_alerts', (select count(*) from public.notifications where tenant_id = _t and kind = 'maintenance_due' and read_at is null),
    'customers_active', (select count(*) from public.customer_profiles where tenant_id = _t and is_active),
    'customers_new', (select count(*) from public.customer_profiles where tenant_id = _t and created_at >= date_trunc('month', current_date)),
    'customers_debt', (select count(distinct i.customer_id) from public.invoices i where i.tenant_id = _t and i.customer_id is not null
      and i.status in ('sent','partially_paid','overdue') and i.balance > 0));
end $$;

-- Serie mensual para la gráfica de tendencia (ingresos vs gastos + utilidad). Wrapper de monthly_series_for
-- que fuerza current_tenant (el frontend no pasa tenant_id). pct=0 no afecta income/totalOut/operatingProfit.
create or replace function public.get_trend_series(p_year integer default extract(year from current_date)::int)
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare _t uuid := current_tenant();
begin
  if not public.can_access_module('dashboard','view') then return '[]'::jsonb; end if;
  return public.monthly_series_for(_t, p_year, 0);
end $$;
