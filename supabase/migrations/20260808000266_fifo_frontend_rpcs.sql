-- FIFO Parte 2 (frontend) — RPCs de soporte
-- 1) set_costing_method: wrapper gateado por CEO para cambiar el método (corre _migrate_to_fifo si pasa a fifo).
--    _migrate_to_fifo está revocado de authenticated; este wrapper DEFINER lo invoca internamente.
-- 2) list_item_movements: expone cogs_total/cogs_unit (gated por permiso de costo) para el kardex.

-- ============ 1. set_costing_method ============
create or replace function public.set_costing_method(p_method text)
returns text language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant();
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  if p_method not in ('weighted_avg', 'fifo') then raise exception 'Método de costeo inválido'; end if;
  if p_method = 'fifo' then perform public._migrate_to_fifo(_t); end if;  -- capa base ANTES de activar fifo
  update public.tenants set costing_method = p_method where id = _t;
  return p_method;
end $function$;
grant execute on function public.set_costing_method(text) to authenticated;

-- ============ 2. list_item_movements + COGS ============
drop function if exists public.list_item_movements(uuid);
create or replace function public.list_item_movements(p_item_id uuid)
returns table(id uuid, movement_type text, quantity numeric, delta numeric, unit_cost numeric, cogs_total numeric, cogs_unit numeric, running_balance numeric, movement_date date, notes text, employee text, client_name text, service_type text, route_date date)
language sql stable security definer set search_path to 'public' as $function$
  select x.id, x.movement_type, x.quantity, x.delta,
    case when public.can_access_module('inventory','cost') then x.unit_cost else null end as unit_cost,
    case when public.can_access_module('inventory','cost') then x.cogs_total else null end as cogs_total,
    case when public.can_access_module('inventory','cost') then x.cogs_unit else null end as cogs_unit,
    x.running_balance, x.movement_date, x.notes, x.employee, x.client_name, x.service_type, x.route_date
  from (
    select m.id, m.movement_type, m.quantity, coalesce(m.delta,0) as delta, m.unit_cost, m.cogs_total, m.cogs_unit, m.movement_date, m.created_at, m.notes,
      coalesce(p.full_name,'—') as employee, s.client_name, s.service_type, r.route_date,
      sum(coalesce(m.delta,0)) over (order by m.movement_date, m.created_at rows unbounded preceding) as running_balance
    from public.inventory_movements m
      left join public.profiles p on p.id = m.created_by
      left join public.route_stops s on s.id = m.linked_stop_id
      left join public.service_routes r on r.id = s.route_id
    where m.item_id = p_item_id and m.tenant_id = current_tenant() and m.deleted_at is null
  ) x
  order by x.movement_date desc, x.created_at desc;
$function$;
