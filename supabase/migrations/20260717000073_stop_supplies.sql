-- 20260717000073_stop_supplies.sql
-- Insumos por parada: consumo de inventario registrado en una parada de ruta.
-- Reusa inventory_movements ('salida') + decremento de inventory_items.stock.
-- RPC SECURITY DEFINER porque el rol servicio no tiene escritura directa en inventario.

alter table public.inventory_movements
  add column if not exists linked_stop_id uuid references public.route_stops(id) on delete set null;

create index if not exists idx_inv_mov_stop on public.inventory_movements(linked_stop_id);

-- Registra insumos usados en una parada: por cada item valida stock, inserta movimiento 'salida' y decrementa stock.
create or replace function public.record_stop_supplies(p_stop_id uuid, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_tenant uuid; v_item jsonb; v_item_id uuid; v_qty numeric; v_stock numeric; v_cost numeric;
begin
  select r.tenant_id into v_tenant
  from route_stops s join service_routes r on r.id = s.route_id
  where s.id = p_stop_id;
  if v_tenant is null or v_tenant <> current_tenant() then raise exception 'Parada no encontrada'; end if;
  if not can_access_module('routes', 'edit') then raise exception 'No autorizado'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_item_id := (v_item->>'item_id')::uuid;
    v_qty := (v_item->>'quantity')::numeric;
    if v_qty is null or v_qty <= 0 then continue; end if;
    select stock, unit_cost into v_stock, v_cost
      from inventory_items where id = v_item_id and tenant_id = v_tenant for update;
    if v_stock is null then raise exception 'Insumo no encontrado'; end if;
    if v_qty > v_stock then raise exception 'Stock insuficiente'; end if;
    insert into inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, linked_stop_id, created_by)
      values (v_tenant, v_item_id, 'salida', v_qty, v_cost, current_date, 'Insumo de ruta', p_stop_id, auth.uid());
    update inventory_items set stock = stock - v_qty, updated_at = now() where id = v_item_id;
  end loop;
end $$;

grant execute on function public.record_stop_supplies(uuid, jsonb) to authenticated;

-- Insumos ya registrados en una parada (para mostrarlos en el detalle).
create or replace function public.get_stop_supplies(p_stop_id uuid)
returns table(item_id uuid, name text, quantity numeric) language sql security definer set search_path = public as $$
  select m.item_id, i.name, sum(m.quantity)
  from inventory_movements m join inventory_items i on i.id = m.item_id
  where m.linked_stop_id = p_stop_id and m.deleted_at is null and i.tenant_id = current_tenant()
  group by m.item_id, i.name order by i.name;
$$;

grant execute on function public.get_stop_supplies(uuid) to authenticated;
