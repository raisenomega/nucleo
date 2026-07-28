-- ============================================================================
-- V2 · RPCs del flujo de ventas — Sales Orders + Delivery Notes + Reserva ATP
-- Diseño: docs-nucleo/ARQUITECTURA-FLUJO-VENTAS-NUCLEO.md §2-§8
-- create_sales_order → confirm (reserva ATP) → create_delivery_note →
--   dispatch (deduce físico + COGS GL auto) → create_invoice_from_delivery
-- Pivote: el despacho inserta inventory_movements 'salida' → el trigger vivo
--   _gl_post_inventory_movement postea Dr 5100 COGS / Cr 1130 (sin código nuevo).
--   La factura nace con delivery_note_id → guard V1 NO re-deduce al pagar.
-- ============================================================================

-- ── Helpers de reserva (espejo de _add_warehouse_stock/_recalc_item_total_stock) ──
create or replace function public._add_warehouse_reserved(_tenant uuid, _item uuid, _wh uuid, _delta numeric)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
begin
  insert into public.inventory_stock (tenant_id, item_id, warehouse_id, quantity, reserved_qty)
    values (_tenant, _item, _wh, 0, greatest(_delta, 0))
  on conflict (item_id, warehouse_id)
    do update set reserved_qty = public.inventory_stock.reserved_qty + _delta, updated_at = now();
end $function$;

create or replace function public._recalc_item_reserved(p_item_id uuid)
 returns void language sql security definer set search_path to 'public'
as $function$
  update public.inventory_items
    set reserved = coalesce((select sum(reserved_qty) from public.inventory_stock where item_id = p_item_id), 0),
        updated_at = now()
  where id = p_item_id;
$function$;

-- ── Deducción física de un item (espejo de la rama forward de _apply_invoice_stock) ──
-- Inserta inventory_movements → dispara COGS GL. Devuelve cogs_total.
create or replace function public._deduct_item_stock(
  p_tenant uuid, p_item_id uuid, p_warehouse uuid, p_qty numeric, p_mtype text, p_note text
) returns numeric
 language plpgsql security definer set search_path to 'public'
as $function$
declare _cost numeric; _track text; _name text; _wh uuid; _wq numeric; _cogs_layer numeric;
begin
  if p_qty is null or p_qty <= 0 then return 0; end if;
  _wh := coalesce(p_warehouse, public._default_warehouse(p_tenant));
  select coalesce(avg_cost, unit_cost, 0), name, tracking_type
    into _cost, _name, _track
    from public.inventory_items where id = p_item_id and tenant_id = p_tenant for update;
  if not found then raise exception 'Item de inventario inválido'; end if;

  if _track = 'none' then
    if public._costing_method(p_tenant) = 'fifo' then
      _cogs_layer := public._deduct_fifo(p_item_id, _wh, p_qty);
      insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost,
        movement_date, notes, created_by, warehouse_id, cogs_total, cogs_unit)
        values (p_tenant, p_item_id, p_mtype, p_qty, round(_cogs_layer / nullif(p_qty, 0), 4),
                current_date, p_note, auth.uid(), _wh, _cogs_layer, round(_cogs_layer / nullif(p_qty, 0), 4));
      return _cogs_layer;
    else
      select quantity into _wq from public.inventory_stock where item_id = p_item_id and warehouse_id = _wh for update;
      if coalesce(_wq, 0) - p_qty < 0 then
        raise exception 'Stock insuficiente para %: disponible %, requerido %', _name, coalesce(_wq, 0), p_qty;
      end if;
      insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost,
        movement_date, notes, created_by, warehouse_id, cogs_total, cogs_unit)
        values (p_tenant, p_item_id, p_mtype, p_qty, _cost, current_date, p_note, auth.uid(), _wh,
                round(p_qty * _cost, 2), _cost);
      perform public._add_warehouse_stock(p_tenant, p_item_id, _wh, -p_qty);
      perform public._recalc_item_total_stock(p_item_id);
      return round(p_qty * _cost, 2);
    end if;
  else
    -- lote/serie: FEFO (inserta el movimiento + postea GL internamente)
    perform public._deduct_fefo(p_tenant, p_item_id, _wh, p_qty, p_mtype, p_note, null, null);
    return round(p_qty * _cost, 2);
  end if;
end $function$;

-- ── Notificación in-app al CEO (sin email; E2E-safe) ──
create or replace function public._notify_sales(_tenant uuid, _kind text, _title text, _body text, _entity uuid, _entity_type text)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _uid uuid;
begin
  select user_id into _uid from public.user_roles
    where tenant_id = _tenant and role in ('ceo', 'superadmin') order by role limit 1;
  perform public._notify_user(_tenant, _uid, _kind, _title, _body, _entity_type, _entity);
end $function$;

-- ── Recalcular status del SO desde qty_shipped/qty_invoiced ──
create or replace function public._refresh_so_status(p_so uuid)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _tot numeric; _ship numeric; _inv numeric; _st text; _cur text;
begin
  select status into _cur from public.sales_orders where id = p_so;
  if _cur is null or _cur in ('cancelled', 'closed', 'draft') then return; end if;
  select sum(qty_ordered), sum(qty_shipped), sum(qty_invoiced)
    into _tot, _ship, _inv from public.sales_order_items where sales_order_id = p_so;
  if coalesce(_tot, 0) = 0 then return; end if;
  if _inv >= _tot then _st := 'invoiced';
  elsif coalesce(_inv, 0) > 0 then _st := 'partially_invoiced';
  elsif _ship >= _tot then _st := 'shipped';
  elsif coalesce(_ship, 0) > 0 then _st := 'partially_shipped';
  else _st := 'confirmed';
  end if;
  update public.sales_orders set status = _st, updated_at = now() where id = p_so;
end $function$;

-- ── Helper: insertar items de SO desde jsonb ──
create or replace function public._insert_so_items(p_so uuid, p_tenant uuid, p_items jsonb)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _it jsonb; _n int := 0;
begin
  for _it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    _n := _n + 1;
    insert into public.sales_order_items(sales_order_id, tenant_id, product_id, item_id, description,
      qty_ordered, unit_price, discount_pct, tax_pct, warehouse_id, line_order)
      values (p_so, p_tenant, nullif(_it->>'product_id', '')::uuid, nullif(_it->>'item_id', '')::uuid,
        coalesce(nullif(_it->>'description', ''), 'Item'), coalesce((_it->>'qty')::numeric, (_it->>'quantity')::numeric, 1),
        coalesce((_it->>'unit_price')::numeric, 0), coalesce((_it->>'discount_pct')::numeric, 0),
        coalesce((_it->>'tax_pct')::numeric, 0),
        coalesce(nullif(_it->>'warehouse_id', '')::uuid, public._default_warehouse(p_tenant)), _n);
  end loop;
end $function$;

-- ════════════════════ TAREA 1 · Sales Order RPCs ════════════════════
create or replace function public.create_sales_order(
  p_customer_id uuid, p_items jsonb, p_delivery_date date default null,
  p_shipping_address_id uuid default null, p_payment_terms text default null,
  p_notes_internal text default null, p_notes_customer text default null, p_quote_id uuid default null
) returns uuid
 language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _so uuid;
begin
  if not public.can_access_module('sales', 'create') then raise exception 'No autorizado'; end if;
  if not exists (select 1 from public.customer_profiles where id = p_customer_id and tenant_id = _t) then
    raise exception 'Cliente inválido'; end if;
  if p_quote_id is not null and not exists (select 1 from public.quotes where id = p_quote_id and tenant_id = _t) then
    raise exception 'Cotización inválida'; end if;
  insert into public.sales_orders(tenant_id, customer_id, quote_id, delivery_date, shipping_address_id,
    payment_terms, notes_internal, notes_customer, status, created_by)
    values (_t, p_customer_id, p_quote_id, p_delivery_date, p_shipping_address_id,
      coalesce(p_payment_terms, (select payment_terms from public.customer_profiles where id = p_customer_id)),
      p_notes_internal, p_notes_customer, 'draft', auth.uid())
    returning id into _so;
  perform public._insert_so_items(_so, _t, p_items);
  return _so;
end $function$;

create or replace function public.create_sales_order_from_quote(p_quote_id uuid)
 returns uuid language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _q record; _so uuid; _items jsonb;
begin
  if not public.can_access_module('sales', 'create') then raise exception 'No autorizado'; end if;
  select * into _q from public.quotes where id = p_quote_id and tenant_id = _t;
  if not found then raise exception 'Cotización no encontrada'; end if;
  if _q.customer_id is null then raise exception 'La cotización no tiene cliente vinculado'; end if;
  -- construir items desde quote_line_items, resolviendo item_id via landing_product_id
  select coalesce(jsonb_agg(jsonb_build_object(
      'description', ql.description, 'quantity', ql.quantity, 'unit_price', ql.unit_price,
      'discount_pct', ql.discount_pct, 'tax_pct', ql.tax_pct, 'product_id', ql.product_id,
      'item_id', (select id from public.inventory_items i where i.landing_product_id = ql.product_id and i.tenant_id = _t))
    order by ql.sort), '[]'::jsonb)
    into _items from public.quote_line_items ql where ql.quote_id = p_quote_id;
  insert into public.sales_orders(tenant_id, customer_id, quote_id, payment_terms, notes_customer, status, created_by)
    values (_t, _q.customer_id, p_quote_id, nullif(_q.terms, ''), _q.notes, 'draft', auth.uid())
    returning id into _so;
  perform public._insert_so_items(_so, _t, _items);
  return _so;
end $function$;

create or replace function public.confirm_sales_order(p_order_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _so record; _si record; _wh uuid;
        _atp numeric; _phys numeric; _resv numeric; _reserve numeric;
        _back jsonb := '[]'::jsonb; _bcount int := 0;
begin
  if not public.can_access_module('sales', 'edit') then raise exception 'No autorizado'; end if;
  select * into _so from public.sales_orders where id = p_order_id and tenant_id = _t for update;
  if not found then raise exception 'SO no encontrado'; end if;
  if _so.status <> 'draft' then raise exception 'SO no está en draft (está %)', _so.status; end if;

  for _si in select * from public.sales_order_items where sales_order_id = p_order_id loop
    if _si.item_id is null then continue; end if;                     -- servicio: no reserva
    _wh := coalesce(_si.warehouse_id, public._default_warehouse(_t));
    select quantity, reserved_qty into _phys, _resv
      from public.inventory_stock where item_id = _si.item_id and warehouse_id = _wh for update;
    _atp := coalesce(_phys, 0) - coalesce(_resv, 0);
    if _atp >= _si.qty_ordered then
      _reserve := _si.qty_ordered;
      update public.sales_order_items set qty_backordered = 0 where id = _si.id;
    elsif _atp > 0 then                                               -- backorder parcial (D3)
      _reserve := _atp;
      update public.sales_order_items set qty_backordered = _si.qty_ordered - _atp where id = _si.id;
      _back := _back || jsonb_build_object('description', _si.description, 'qty_backordered', _si.qty_ordered - _atp);
      _bcount := _bcount + 1;
    else                                                             -- todo en backorder
      _reserve := 0;
      update public.sales_order_items set qty_backordered = _si.qty_ordered where id = _si.id;
      _back := _back || jsonb_build_object('description', _si.description, 'qty_backordered', _si.qty_ordered);
      _bcount := _bcount + 1;
    end if;
    if _reserve > 0 then
      perform public._add_warehouse_reserved(_t, _si.item_id, _wh, _reserve);
      perform public._recalc_item_reserved(_si.item_id);
    end if;
  end loop;

  update public.sales_orders set status = 'confirmed', confirmed_at = now(), confirmed_by = auth.uid()
    where id = p_order_id;
  if _bcount > 0 then
    perform public._notify_sales(_t, 'sales_backorder', _so.order_number || ' confirmado con backorder',
      _bcount || ' item(s) sin stock suficiente', p_order_id, 'sales_order');
  end if;
  return jsonb_build_object('confirmed', true, 'backordered_items', _back);
end $function$;

create or replace function public.cancel_sales_order(p_order_id uuid, p_reason text default null)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _so record; _si record; _wh uuid; _release numeric;
begin
  if not public.can_access_module('sales', 'edit') then raise exception 'No autorizado'; end if;
  select * into _so from public.sales_orders where id = p_order_id and tenant_id = _t for update;
  if not found then raise exception 'SO no encontrado'; end if;
  if _so.status not in ('draft', 'confirmed') then raise exception 'No se puede cancelar en estado %', _so.status; end if;
  if exists (select 1 from public.delivery_notes where sales_order_id = p_order_id and status <> 'cancelled') then
    raise exception 'El SO tiene conduces activos; cancélelos primero'; end if;
  if _so.status = 'confirmed' then
    for _si in select * from public.sales_order_items where sales_order_id = p_order_id loop
      if _si.item_id is null then continue; end if;
      _wh := coalesce(_si.warehouse_id, public._default_warehouse(_t));
      _release := (_si.qty_ordered - coalesce(_si.qty_backordered, 0)) - coalesce(_si.qty_shipped, 0);
      if _release > 0 then
        perform public._add_warehouse_reserved(_t, _si.item_id, _wh, -_release);
        perform public._recalc_item_reserved(_si.item_id);
      end if;
    end loop;
  end if;
  update public.sales_orders set status = 'cancelled', cancelled_at = now(), cancel_reason = p_reason
    where id = p_order_id;
end $function$;

create or replace function public.update_sales_order(p_order_id uuid, p_data jsonb)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _st text;
begin
  if not public.can_access_module('sales', 'edit') then raise exception 'No autorizado'; end if;
  select status into _st from public.sales_orders where id = p_order_id and tenant_id = _t;
  if _st is null then raise exception 'SO no encontrado'; end if;
  if _st <> 'draft' then raise exception 'Solo se puede editar un SO en draft'; end if;
  update public.sales_orders set
    delivery_date       = coalesce(nullif(p_data->>'delivery_date', '')::date, delivery_date),
    shipping_address_id = coalesce(nullif(p_data->>'shipping_address_id', '')::uuid, shipping_address_id),
    shipping_notes      = coalesce(p_data->>'shipping_notes', shipping_notes),
    payment_terms       = coalesce(p_data->>'payment_terms', payment_terms),
    notes_internal      = coalesce(p_data->>'notes_internal', notes_internal),
    notes_customer      = coalesce(p_data->>'notes_customer', notes_customer),
    updated_at          = now()
  where id = p_order_id;
  if p_data ? 'items' then
    delete from public.sales_order_items where sales_order_id = p_order_id;
    perform public._insert_so_items(p_order_id, _t, p_data->'items');
  end if;
end $function$;

-- ════════════════════ TAREA 2 · Delivery Note RPCs ════════════════════
create or replace function public.create_delivery_note(
  p_sales_order_id uuid, p_items jsonb, p_shipping_notes text default null, p_notes text default null
) returns uuid
 language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _so record; _dn uuid; _it jsonb; _si record; _qd numeric; _n int := 0; _addr text;
begin
  if not public.can_access_module('sales', 'edit') then raise exception 'No autorizado'; end if;
  select * into _so from public.sales_orders where id = p_sales_order_id and tenant_id = _t;
  if not found then raise exception 'SO no encontrado'; end if;
  if _so.status not in ('confirmed', 'partially_shipped') then
    raise exception 'SO no despachable (estado %)', _so.status; end if;
  select trim(both ', ' from concat_ws(', ', line1, city, state)) into _addr
    from public.customer_addresses where id = _so.shipping_address_id;
  insert into public.delivery_notes(tenant_id, sales_order_id, customer_id, status, shipping_address, shipping_notes, notes, created_by)
    values (_t, p_sales_order_id, _so.customer_id, 'draft', _addr, p_shipping_notes, p_notes, auth.uid())
    returning id into _dn;
  for _it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    select * into _si from public.sales_order_items where id = (_it->>'so_item_id')::uuid and sales_order_id = p_sales_order_id;
    if not found then raise exception 'Item del conduce no pertenece al SO'; end if;
    _qd := coalesce((_it->>'qty_dispatched')::numeric, 0);
    if _qd <= 0 then continue; end if;
    if _qd > _si.qty_ordered - coalesce(_si.qty_shipped, 0) then
      raise exception 'qty_dispatched (%) excede pendiente (%) de %', _qd, _si.qty_ordered - coalesce(_si.qty_shipped, 0), _si.description; end if;
    _n := _n + 1;
    insert into public.delivery_note_items(delivery_note_id, tenant_id, so_item_id, product_id, item_id,
      description, qty_dispatched, warehouse_id, lot_id, line_order)
      values (_dn, _t, _si.id, _si.product_id, _si.item_id, _si.description, _qd,
        coalesce(nullif(_it->>'warehouse_id', '')::uuid, _si.warehouse_id), nullif(_it->>'lot_id', '')::uuid, _n);
  end loop;
  return _dn;
end $function$;

create or replace function public.create_delivery_note_direct(
  p_customer_id uuid, p_items jsonb, p_shipping_notes text default null
) returns uuid
 language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _dn uuid; _it jsonb; _n int := 0;
begin
  if not public.can_access_module('sales', 'edit') then raise exception 'No autorizado'; end if;
  if not exists (select 1 from public.customer_profiles where id = p_customer_id and tenant_id = _t) then
    raise exception 'Cliente inválido'; end if;
  insert into public.delivery_notes(tenant_id, sales_order_id, customer_id, status, shipping_notes, created_by)
    values (_t, null, p_customer_id, 'draft', p_shipping_notes, auth.uid()) returning id into _dn;
  for _it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    _n := _n + 1;
    insert into public.delivery_note_items(delivery_note_id, tenant_id, item_id, description, qty_dispatched, warehouse_id, lot_id, line_order)
      values (_dn, _t, nullif(_it->>'item_id', '')::uuid, coalesce(nullif(_it->>'description', ''), 'Item'),
        coalesce((_it->>'qty_dispatched')::numeric, 1),
        coalesce(nullif(_it->>'warehouse_id', '')::uuid, public._default_warehouse(_t)), nullif(_it->>'lot_id', '')::uuid, _n);
  end loop;
  return _dn;
end $function$;

create or replace function public.dispatch_delivery_note(p_note_id uuid)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _dn record; _di record; _wh uuid; _rel numeric; _cur_resv numeric;
begin
  if not public.can_access_module('sales', 'edit') then raise exception 'No autorizado'; end if;
  select * into _dn from public.delivery_notes where id = p_note_id and tenant_id = _t for update;
  if not found then raise exception 'Conduce no encontrado'; end if;
  if _dn.status <> 'draft' then raise exception 'Conduce no está en draft (está %)', _dn.status; end if;

  for _di in select * from public.delivery_note_items where delivery_note_id = p_note_id loop
    if _di.item_id is not null then
      _wh := coalesce(_di.warehouse_id, public._default_warehouse(_t));
      -- deduce físico + inserta 'salida' → COGS GL automático (_gl_post_inventory_movement)
      perform public._deduct_item_stock(_t, _di.item_id, _wh, _di.qty_dispatched, 'salida', 'Conduce ' || _dn.note_number);
      -- liberar reserva (solo si vino de un SO que reservó)
      if _dn.sales_order_id is not null then
        select reserved_qty into _cur_resv from public.inventory_stock where item_id = _di.item_id and warehouse_id = _wh;
        _rel := least(_di.qty_dispatched, coalesce(_cur_resv, 0));
        if _rel > 0 then
          perform public._add_warehouse_reserved(_t, _di.item_id, _wh, -_rel);
          perform public._recalc_item_reserved(_di.item_id);
        end if;
      end if;
    end if;
    if _di.so_item_id is not null then
      update public.sales_order_items set qty_shipped = coalesce(qty_shipped, 0) + _di.qty_dispatched where id = _di.so_item_id;
    end if;
  end loop;

  update public.delivery_notes set status = 'dispatched', dispatched_at = now(), dispatched_by = auth.uid(), dispatch_date = current_date
    where id = p_note_id;
  if _dn.sales_order_id is not null then perform public._refresh_so_status(_dn.sales_order_id); end if;
  perform public._notify_sales(_t, 'sales_dispatch', _dn.note_number || ' despachado',
    'Conduce despachado', p_note_id, 'delivery_note');
end $function$;

create or replace function public.deliver_delivery_note(
  p_note_id uuid, p_received_by text default null, p_signature text default null, p_photos jsonb default null
) returns void
 language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _st text;
begin
  if not public.can_access_module('sales', 'edit') then raise exception 'No autorizado'; end if;
  select status into _st from public.delivery_notes where id = p_note_id and tenant_id = _t;
  if _st is null then raise exception 'Conduce no encontrado'; end if;
  if _st <> 'dispatched' then raise exception 'El conduce debe estar despachado (está %)', _st; end if;
  update public.delivery_notes set status = 'delivered', delivered_at = now(), delivered_by = auth.uid(),
    received_by = p_received_by, signature_data = coalesce(p_signature, signature_data),
    evidence_photos = coalesce(p_photos, evidence_photos)
  where id = p_note_id;
end $function$;

create or replace function public.cancel_delivery_note(p_note_id uuid, p_reason text default null)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _st text;
begin
  if not public.can_access_module('sales', 'edit') then raise exception 'No autorizado'; end if;
  select status into _st from public.delivery_notes where id = p_note_id and tenant_id = _t;
  if _st is null then raise exception 'Conduce no encontrado'; end if;
  if _st <> 'draft' then raise exception 'Solo se cancela un conduce en draft (el stock ya salió)'; end if;
  delete from public.delivery_note_items where delivery_note_id = p_note_id;
  update public.delivery_notes set status = 'cancelled', cancelled_at = now(), cancel_reason = p_reason
    where id = p_note_id;
end $function$;

-- ════════════════════ TAREA 3 · Facturar desde conduce / SO ════════════════════
create or replace function public.create_invoice_from_delivery(p_delivery_note_id uuid, p_due_date date default null)
 returns uuid language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _dn record; _cust record; _items jsonb;
        _sub numeric; _tax numeric; _terms text; _due date; _inv uuid;
begin
  if not public.can_access_module('billing', 'create') then raise exception 'No autorizado'; end if;
  select * into _dn from public.delivery_notes where id = p_delivery_note_id and tenant_id = _t;
  if not found then raise exception 'Conduce no encontrado'; end if;
  if _dn.status not in ('dispatched', 'delivered') then raise exception 'El conduce no ha sido despachado'; end if;
  select * into _cust from public.customer_profiles where id = _dn.customer_id;

  select coalesce(jsonb_agg(jsonb_build_object(
      'description', di.description, 'quantity', di.qty_dispatched,
      'unit_price', coalesce(si.unit_price, 0), 'discount_pct', coalesce(si.discount_pct, 0),
      'tax_pct', coalesce(si.tax_pct, 0), 'product_id', di.product_id,
      'line_total', round(di.qty_dispatched * coalesce(si.unit_price, 0) * (1 - coalesce(si.discount_pct, 0) / 100), 2))
    order by di.line_order), '[]'::jsonb)
    into _items
    from public.delivery_note_items di
    left join public.sales_order_items si on si.id = di.so_item_id
    where di.delivery_note_id = p_delivery_note_id;

  select coalesce(sum((e->>'line_total')::numeric), 0),
         coalesce(sum(round((e->>'line_total')::numeric * (e->>'tax_pct')::numeric / 100, 2)), 0)
    into _sub, _tax from jsonb_array_elements(_items) e;

  _terms := coalesce((select payment_terms from public.sales_orders where id = _dn.sales_order_id),
                     _cust.payment_terms, 'immediate');
  _due := coalesce(p_due_date, current_date + public._payment_terms_days(_terms, _cust.payment_terms_custom_days));

  insert into public.invoices(tenant_id, client_name, phone, email, customer_id, due_date, items,
    subtotal, tax, total, status, sales_order_id, delivery_note_id, created_by)
    values (_t, coalesce(_cust.full_name, _cust.display_name, 'Cliente'), _cust.phone, _cust.email, _dn.customer_id,
      _due, _items, _sub, _tax, _sub + _tax, 'draft', _dn.sales_order_id, p_delivery_note_id, auth.uid())
    returning id into _inv;

  -- avanzar qty_invoiced en los items del SO
  update public.sales_order_items si set qty_invoiced = coalesce(qty_invoiced, 0) + di.qty_dispatched
    from public.delivery_note_items di
    where di.so_item_id = si.id and di.delivery_note_id = p_delivery_note_id;
  if _dn.sales_order_id is not null then perform public._refresh_so_status(_dn.sales_order_id); end if;
  return _inv;
end $function$;

create or replace function public.create_invoice_from_sales_order(
  p_order_id uuid, p_items jsonb default null, p_due_date date default null
) returns uuid
 language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _so record; _cust record; _items jsonb;
        _sub numeric; _tax numeric; _terms text; _due date; _inv uuid;
begin
  if not public.can_access_module('billing', 'create') then raise exception 'No autorizado'; end if;
  select * into _so from public.sales_orders where id = p_order_id and tenant_id = _t;
  if not found then raise exception 'SO no encontrado'; end if;
  select * into _cust from public.customer_profiles where id = _so.customer_id;

  -- por defecto: lo pendiente de facturar (qty_ordered - qty_invoiced) de cada línea
  select coalesce(jsonb_agg(jsonb_build_object(
      'description', si.description, 'quantity', si.qty_ordered - coalesce(si.qty_invoiced, 0),
      'unit_price', coalesce(si.unit_price, 0), 'discount_pct', coalesce(si.discount_pct, 0),
      'tax_pct', coalesce(si.tax_pct, 0), 'product_id', si.product_id,
      'line_total', round((si.qty_ordered - coalesce(si.qty_invoiced, 0)) * coalesce(si.unit_price, 0) * (1 - coalesce(si.discount_pct, 0) / 100), 2))
    order by si.line_order), '[]'::jsonb)
    into _items from public.sales_order_items si
    where si.sales_order_id = p_order_id and si.qty_ordered - coalesce(si.qty_invoiced, 0) > 0;

  if _items = '[]'::jsonb then raise exception 'No hay cantidades pendientes de facturar'; end if;

  select coalesce(sum((e->>'line_total')::numeric), 0),
         coalesce(sum(round((e->>'line_total')::numeric * (e->>'tax_pct')::numeric / 100, 2)), 0)
    into _sub, _tax from jsonb_array_elements(_items) e;

  _terms := coalesce(_so.payment_terms, _cust.payment_terms, 'immediate');
  _due := coalesce(p_due_date, current_date + public._payment_terms_days(_terms, _cust.payment_terms_custom_days));

  -- sales_order_id seteado (sin delivery_note_id) → guard V1 NO deduce stock al pagar
  insert into public.invoices(tenant_id, client_name, phone, email, customer_id, due_date, items,
    subtotal, tax, total, status, sales_order_id, created_by)
    values (_t, coalesce(_cust.full_name, _cust.display_name, 'Cliente'), _cust.phone, _cust.email, _so.customer_id,
      _due, _items, _sub, _tax, _sub + _tax, 'draft', p_order_id, auth.uid())
    returning id into _inv;

  update public.sales_order_items set qty_invoiced = qty_ordered where sales_order_id = p_order_id;
  perform public._refresh_so_status(p_order_id);
  return _inv;
end $function$;

-- ════════════════════ TAREA 4 · Budget helper ════════════════════
create or replace function public.copy_budget_year(p_from_year integer, p_to_year integer, p_multiplier numeric default 1.0)
 returns integer language plpgsql security definer set search_path to 'public'
as $function$
declare _n integer;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  insert into public.budget_lines(tenant_id, account_id, fiscal_year, period_month, budgeted_amount, created_by)
    select tenant_id, account_id, p_to_year, period_month, round(budgeted_amount * p_multiplier, 2), auth.uid()
    from public.budget_lines where tenant_id = current_tenant() and fiscal_year = p_from_year
    on conflict (tenant_id, account_id, fiscal_year, period_month) do nothing;
  get diagnostics _n = row_count;
  return _n;
end $function$;

-- ════════════════════ TAREA 5 · Módulo 'sales' para operaciones (dispatch) ════════════════════
-- ceo/coo ya obtienen true para cualquier módulo; se añade 'sales' view+edit a operaciones
-- (rol de almacén: ver SO y despachar conduces). Resto de la función intacto.
create or replace function public.can_access_module(p_module text, p_perm text default 'view'::text)
 returns boolean language plpgsql stable security definer set search_path to 'public'
as $function$
declare _role text; _access jsonb;
begin
  _role := current_setting('request.jwt.claims', true)::jsonb->>'user_role';
  select ed.module_access into _access from public.employee_details ed
    join public.profiles p on p.id = ed.profile_id
    where p.id = auth.uid() and ed.tenant_id = current_tenant();
  if _access is not null and _access->p_module is not null then
    return coalesce((_access->p_module->>p_perm)::boolean, false);
  end if;
  if _role in ('superadmin', 'ceo') then return true; end if;
  if _role = 'coo' then
    if p_module = 'settings' and p_perm not in ('view', 'categories') then return false; end if;
    return true;
  end if;
  if _role = 'operaciones' then
    if p_module = 'dashboard' and p_perm = 'view' then return true; end if;
    if p_module = 'inventory' and p_perm in ('view', 'edit') then return true; end if;
    if p_module = 'assets' and p_perm in ('view', 'edit') then return true; end if;
    if p_module = 'sales' and p_perm in ('view', 'edit') then return true; end if;
    if p_module = 'expenses' and p_perm in ('view', 'create') then return true; end if;
    if p_module = 'leads' and p_perm = 'view' then return true; end if;
    if p_module = 'accounts_receivable' and p_perm = 'view' then return true; end if;
    if p_module = 'reports' and p_perm = 'view' then return true; end if;
    if p_module = 'routes' then return true; end if;
    if p_module = 'income' and p_perm = 'view' then return true; end if;
    if p_module = 'observations' and p_perm = 'view' then return true; end if;
    if p_module = 'training' and p_perm = 'view' then return true; end if;
    return false;
  end if;
  if _role = 'servicio' then
    if p_module = 'dashboard' and p_perm = 'view' then return true; end if;
    if p_module = 'inventory' and p_perm = 'view' then return true; end if;
    if p_module = 'assets' and p_perm in ('view', 'edit') then return true; end if;
    if p_module = 'routes' and p_perm in ('view', 'create', 'edit') then return true; end if;
    if p_module = 'income' and p_perm = 'view' then return true; end if;
    if p_module = 'expenses' and p_perm = 'view' then return true; end if;
    if p_module = 'observations' and p_perm = 'view' then return true; end if;
    if p_module = 'training' and p_perm = 'view' then return true; end if;
    return false;
  end if;
  return false;
end; $function$;

-- ════════════════════ TAREA 6 · Seed: despachar CN-0001 + factura (best-effort) ════════════════════
-- Ejecuta el flujo real con los RPCs sobre el SO/CN que sembró V1. Best-effort:
-- si falla (p.ej. faltan capas FIFO para esos items), NO rompe la migración —
-- los RPCs (lo importante) ya quedaron definidos.
do $seed$
declare _t uuid; _cn uuid; _creator uuid;
begin
  select id into _t from public.tenants where slug = 'vital-motion-cafbf0';
  if _t is null then return; end if;
  select id into _cn from public.delivery_notes where tenant_id = _t and note_number = 'CN-0001' and status = 'draft';
  if _cn is null then return; end if;                                 -- ya despachado o no existe
  select id into _creator from public.profiles where tenant_id = _t order by created_at limit 1;

  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', _creator::text, 'tenant_id', _t::text, 'user_role', 'ceo', 'role', 'authenticated')::text, true);
  begin
    perform public.dispatch_delivery_note(_cn);
    perform public.create_invoice_from_delivery(_cn);
  exception when others then
    raise warning 'Seed V2: despacho demo omitido (%). CN-0001 queda en draft.', sqlerrm;
  end;
  perform set_config('request.jwt.claims', '', true);
end $seed$;
