-- 20260808000262 · Multi-almacén — diferidos (5d conteo por almacén + 5e PO destino)
-- Backward compatible: warehouse_id nullable → NULL = comportamiento actual (total / almacén default).
-- apply_inventory_count ya propaga _l.warehouse_id (migr 260) → sin cambios aquí.

alter table public.inventory_purchase_orders add column if not exists warehouse_id uuid references public.warehouses(id);
alter table public.inventory_counts add column if not exists warehouse_id uuid references public.warehouses(id);

-- create_inventory_count: +p_warehouse_id. Con almacén → expected_qty desde inventory_stock + warehouse_id por línea.
drop function if exists public.create_inventory_count(text, uuid, uuid, boolean, text, uuid[]);
create or replace function public.create_inventory_count(p_count_type text, p_category_id uuid default null, p_assigned_to uuid default null, p_blind boolean default true, p_notes text default null, p_item_ids uuid[] default null, p_warehouse_id uuid default null)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _cid uuid; _num text;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  _num := 'CC-' || lpad((coalesce((select max((regexp_replace(count_number,'\D','','g'))::int) from public.inventory_counts where tenant_id = _t), 0) + 1)::text, 3, '0');
  insert into public.inventory_counts(tenant_id, count_number, count_type, category_id, assigned_to, blind_count, notes, created_by, warehouse_id)
    values (_t, _num, p_count_type, p_category_id, p_assigned_to, coalesce(p_blind, true), nullif(p_notes,''), auth.uid(), p_warehouse_id) returning id into _cid;
  if p_warehouse_id is null then
    insert into public.inventory_count_lines(tenant_id, count_id, item_id, expected_qty, unit_cost_at_count)
      select _t, _cid, i.id, i.stock, i.avg_cost from public.inventory_items i
      where i.tenant_id = _t and (
        (p_count_type = 'full') or
        (p_count_type = 'category' and i.category_id = p_category_id) or
        (p_count_type = 'low_stock' and i.min_stock > 0 and i.stock <= i.min_stock) or
        (p_count_type = 'partial' and i.id = any(p_item_ids)));
  else
    insert into public.inventory_count_lines(tenant_id, count_id, item_id, expected_qty, unit_cost_at_count, warehouse_id)
      select _t, _cid, i.id, s.quantity, i.avg_cost, p_warehouse_id
      from public.inventory_items i join public.inventory_stock s on s.item_id = i.id and s.warehouse_id = p_warehouse_id
      where i.tenant_id = _t and (
        (p_count_type = 'full') or
        (p_count_type = 'category' and i.category_id = p_category_id) or
        (p_count_type = 'low_stock' and coalesce(s.min_stock, 0) > 0 and s.quantity <= s.min_stock) or
        (p_count_type = 'partial' and i.id = any(p_item_ids)));
  end if;
  return _cid;
end $function$;

-- receive_purchase_order: fallback al almacén guardado en el PO cuando no se pasa uno explícito.
create or replace function public.receive_purchase_order(p_order_id uuid, p_items jsonb, p_warehouse_id uuid default null)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _po public.inventory_purchase_orders%rowtype; _it jsonb; _item_id uuid; _rq numeric; _cost numeric; _mv uuid; _all boolean; _wh uuid;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select * into _po from public.inventory_purchase_orders where id = p_order_id and tenant_id = _tenant for update;
  if not found then raise exception 'Orden no encontrada'; end if;
  _wh := coalesce(p_warehouse_id, _po.warehouse_id, public._default_warehouse(_tenant));
  for _it in select * from jsonb_array_elements(p_items) loop
    _item_id := (_it->>'item_id')::uuid; _rq := coalesce((_it->>'received_qty')::numeric, 0);
    if _rq <= 0 then continue; end if;
    select unit_cost into _cost from public.inventory_purchase_order_items where order_id = p_order_id and item_id = _item_id;
    if _cost is null then continue; end if;
    update public.inventory_purchase_order_items set received_qty = received_qty + _rq where order_id = p_order_id and item_id = _item_id;
    _mv := public.record_restock(_item_id, _rq, _cost, null, 'Recepción PO', current_date, _po.supplier_id, _wh);
    update public.inventory_movements set linked_restock_id = p_order_id where id = _mv;
  end loop;
  select bool_and(received_qty >= quantity) into _all from public.inventory_purchase_order_items where order_id = p_order_id;
  update public.inventory_purchase_orders set status = case when _all then 'received' else 'partial' end,
    received_at = case when _all then now() else received_at end, updated_at = now() where id = p_order_id;
  return jsonb_build_object('status', case when _all then 'received' else 'partial' end);
end $function$;
