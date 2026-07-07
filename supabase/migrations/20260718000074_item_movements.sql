-- 20260718000074_item_movements.sql
-- Historial de movimientos de un insumo: resumen completo (empleado + parada/servicio + fecha).
-- SECURITY DEFINER: une profiles/route_stops/service_routes (con RLS restringida) de forma
-- segura pero tenant-scoped, para cerrar el ciclo de uso del insumo. Solo lectura.

create or replace function public.list_item_movements(p_item_id uuid)
returns table(
  id uuid, movement_type text, quantity numeric, movement_date date, notes text,
  employee text, client_name text, service_type text, route_date date
) language sql stable security definer set search_path = public as $$
  select m.id, m.movement_type, m.quantity, m.movement_date, m.notes,
    coalesce(p.full_name, '—') as employee,
    s.client_name, s.service_type, r.route_date
  from inventory_movements m
    left join profiles p on p.id = m.created_by
    left join route_stops s on s.id = m.linked_stop_id
    left join service_routes r on r.id = s.route_id
  where m.item_id = p_item_id and m.tenant_id = current_tenant() and m.deleted_at is null
  order by m.movement_date desc, m.created_at desc;
$$;

grant execute on function public.list_item_movements(uuid) to authenticated;
