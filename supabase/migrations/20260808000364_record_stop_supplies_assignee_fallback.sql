-- 20260808000364_record_stop_supplies_assignee_fallback.sql
-- LOGICA DE NEGOCIO: record_stop_supplies (descuento de insumos al servir una parada) era el UNICO RPC
-- mutador de parada con guard pelado can_access_module('routes','edit'). Sus hermanos complete_route_stop
-- (082), record_stop_payment (075) y save_stop_evidence (216) permiten ademas creador o asignado.
-- Efecto: un empleado asignado a la ruta cuyo override granular no incluye routes.edit podia completar,
-- cobrar y subir fotos de la parada, pero recibia 'No autorizado' al descontar insumos del inventario.
-- Fix: anadir el fallback OR created_by=auth.uid() OR assigned_to=auth.uid(), consistente con los otros 3.
-- Solo cambian el declare, el select del stop y el guard; el resto del cuerpo es identico a 20260808000265.
create or replace function public.record_stop_supplies(p_stop_id uuid, p_items jsonb, p_warehouse_id uuid DEFAULT NULL::uuid)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare v_tenant uuid; v_created uuid; v_assigned uuid; v_item jsonb; v_item_id uuid; v_qty numeric; v_cost numeric; v_name text; v_track text; v_wh uuid; v_wq numeric; v_cogs numeric;
begin
  select r.tenant_id, r.created_by, r.assigned_to into v_tenant, v_created, v_assigned from route_stops s join service_routes r on r.id = s.route_id where s.id = p_stop_id;
  if v_tenant is null or v_tenant <> current_tenant() then raise exception 'Parada no encontrada'; end if;
  if not (can_access_module('routes', 'edit') or v_created = auth.uid() or v_assigned = auth.uid()) then raise exception 'No autorizado'; end if;
  v_wh := coalesce(p_warehouse_id, public._default_warehouse(v_tenant));
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_item_id := (v_item->>'item_id')::uuid; v_qty := (v_item->>'quantity')::numeric;
    if v_qty is null or v_qty <= 0 then continue; end if;
    select unit_cost, name, tracking_type into v_cost, v_name, v_track from inventory_items where id = v_item_id and tenant_id = v_tenant for update;
    if not found then raise exception 'Insumo no encontrado'; end if;
    if v_track = 'none' then
      if public._costing_method(v_tenant) = 'fifo' then
        v_cogs := public._deduct_fifo(v_item_id, v_wh, v_qty);
        insert into inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, linked_stop_id, created_by, warehouse_id, cogs_total, cogs_unit)
          values (v_tenant, v_item_id, 'salida', v_qty, round(v_cogs/v_qty,4), current_date, 'Insumo de ruta', p_stop_id, auth.uid(), v_wh, v_cogs, round(v_cogs/v_qty,4));
        perform public._recalc_item_total_stock(v_item_id);
      else
        select quantity into v_wq from public.inventory_stock where item_id = v_item_id and warehouse_id = v_wh for update;
        if coalesce(v_wq, 0) - v_qty < 0 then raise exception 'Stock insuficiente para %: disponible %, requerido %', v_name, coalesce(v_wq, 0), v_qty; end if;
        insert into inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, linked_stop_id, created_by, warehouse_id)
          values (v_tenant, v_item_id, 'salida', v_qty, v_cost, current_date, 'Insumo de ruta', p_stop_id, auth.uid(), v_wh);
        perform public._add_warehouse_stock(v_tenant, v_item_id, v_wh, -v_qty);
        perform public._recalc_item_total_stock(v_item_id);
      end if;
    else
      perform public._deduct_fefo(v_tenant, v_item_id, v_wh, v_qty, 'salida', 'Insumo de ruta', null, p_stop_id);
    end if;
  end loop;
end $function$;
