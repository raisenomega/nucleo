-- FIFO / capas de costo (Gap Fix #8, Parte 1: backend)
-- Reutiliza inventory_lots como "capas de costo" (lot_type='cost_layer') para ítems tracking='none'
-- cuando el tenant usa costing_method='fifo'. Invisibles al usuario (la UI de lotes solo aplica a
-- tracking!='none'). Default 'weighted_avg' → backward-compat total (los paths existentes no cambian).

-- ============ 1. Esquema ============
-- 1a. lot_type += 'cost_layer'
alter table public.inventory_lots drop constraint if exists inventory_lots_lot_type_check;
alter table public.inventory_lots add constraint inventory_lots_lot_type_check
  check (lot_type in ('lot', 'serial', 'cost_layer'));

-- 1d. Relaxar el CHECK de serial (permite cost_layer con quantity > 1)
alter table public.inventory_lots drop constraint if exists inventory_lots_check;
alter table public.inventory_lots add constraint inventory_lots_check
  check (not (lot_type = 'serial' and quantity > 1));

-- 1b. Método de costeo por tenant
alter table public.tenants add column if not exists costing_method text not null default 'weighted_avg'
  check (costing_method in ('weighted_avg', 'fifo'));

-- 1c. COGS real por movimiento (solo lo poblan los paths FIFO; weighted_avg lo deja null)
alter table public.inventory_movements add column if not exists cogs_total numeric;
alter table public.inventory_movements add column if not exists cogs_unit numeric;

-- 1e. Índice para el barrido FIFO
create index if not exists idx_inventory_lots_fifo
  on public.inventory_lots (item_id, warehouse_id, received_date asc)
  where status = 'available' and lot_type in ('lot', 'cost_layer');

-- ============ 2. Helper: método de costeo del tenant ============
create or replace function public._costing_method(p_tenant uuid)
returns text language sql stable security definer set search_path to 'public' as $$
  select coalesce((select costing_method from public.tenants where id = p_tenant), 'weighted_avg');
$$;
revoke execute on function public._costing_method(uuid) from public, anon, authenticated;

-- ============ 3. _deduct_fifo: consume capas por received_date ASC, devuelve el COGS ============
-- No inserta movimientos (el caller inserta 1 movimiento con el cogs). Cascadea stock vía _sync_lot_stock.
create or replace function public._deduct_fifo(p_item_id uuid, p_warehouse_id uuid, p_qty numeric)
returns numeric language plpgsql security definer set search_path to 'public' as $$
declare _lot record; _rem numeric := p_qty; _take numeric; _cogs numeric := 0;
begin
  for _lot in
    select id, quantity, unit_cost from public.inventory_lots
    where item_id = p_item_id and warehouse_id = p_warehouse_id and status = 'available'
      and lot_type in ('lot', 'cost_layer') and quantity > 0
    order by received_date asc nulls first, created_at asc
    for update
  loop
    exit when _rem <= 0;
    _take := least(_lot.quantity, _rem);
    update public.inventory_lots set quantity = quantity - _take,
      status = case when quantity - _take <= 0 then 'consumed' else status end, updated_at = now()
    where id = _lot.id;
    _cogs := _cogs + _take * coalesce(_lot.unit_cost, 0);
    _rem := _rem - _take;
  end loop;
  if _rem > 0 then
    raise exception 'Stock insuficiente en capas FIFO para %: faltan %',
      (select name from public.inventory_items where id = p_item_id), _rem;
  end if;
  return round(_cogs, 4);
end $$;
revoke execute on function public._deduct_fifo(uuid, uuid, numeric) from public, anon, authenticated;

-- ============ 4. record_restock: auto-crea cost_layer si tracking='none' + fifo ============
create or replace function public.record_restock(p_item_id uuid, p_quantity numeric, p_unit_cost numeric, p_supplier text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_date date DEFAULT CURRENT_DATE, p_supplier_id uuid DEFAULT NULL::uuid, p_warehouse_id uuid DEFAULT NULL::uuid, p_lot_number text DEFAULT NULL::text, p_expiry_date date DEFAULT NULL::date, p_manufacture_date date DEFAULT NULL::date)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _item public.inventory_items%rowtype; _mv_id uuid; _base_avg numeric; _new_avg numeric; _wh uuid; _lot_id uuid;
begin
  if p_quantity is null or p_quantity <= 0 then raise exception 'Cantidad inválida'; end if;
  if p_unit_cost is null or p_unit_cost < 0 then raise exception 'Costo inválido'; end if;
  select * into _item from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  _wh := coalesce(p_warehouse_id, public._default_warehouse(_tenant));
  if _wh is null then raise exception 'No hay almacén configurado'; end if;
  _base_avg := coalesce(nullif(_item.avg_cost, 0), nullif(_item.unit_cost, 0), p_unit_cost);
  _new_avg := case when _item.stock + p_quantity > 0 then ((_base_avg * _item.stock) + (p_unit_cost * p_quantity)) / (_item.stock + p_quantity) else p_unit_cost end;
  if _item.tracking_type = 'none' then
    if public._costing_method(_tenant) = 'fifo' then
      insert into public.inventory_lots (tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, received_date, unit_cost, supplier_id, status)
        values (_tenant, p_item_id, _wh, 'CL-'||to_char(coalesce(p_date, current_date),'YYYYMMDD')||'-'||substr(gen_random_uuid()::text,1,8), 'cost_layer', p_quantity, coalesce(p_date, current_date), p_unit_cost, coalesce(p_supplier_id, _item.supplier_id), 'available') returning id into _lot_id;
      insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, supplier_id, warehouse_id, lot_id)
        values (_tenant, p_item_id, 'entrada', p_quantity, p_unit_cost, p_notes, auth.uid(), p_date, p_supplier_id, _wh, _lot_id) returning id into _mv_id;
    else
      insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, supplier_id, warehouse_id)
        values (_tenant, p_item_id, 'entrada', p_quantity, p_unit_cost, p_notes, auth.uid(), p_date, p_supplier_id, _wh) returning id into _mv_id;
      perform public._add_warehouse_stock(_tenant, p_item_id, _wh, p_quantity);
    end if;
  else
    if p_lot_number is null or btrim(p_lot_number) = '' then raise exception 'Lote/serie requerido para este ítem'; end if;
    if _item.tracking_type = 'serial' then
      if p_quantity <> 1 then raise exception 'Ítem serializado: la cantidad debe ser 1'; end if;
      insert into public.inventory_lots (tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, expiry_date, manufacture_date, supplier_id, unit_cost, received_date)
        values (_tenant, p_item_id, _wh, p_lot_number, 'serial', 1, p_expiry_date, p_manufacture_date, coalesce(p_supplier_id, _item.supplier_id), p_unit_cost, p_date) returning id into _lot_id;
    else
      insert into public.inventory_lots (tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, expiry_date, manufacture_date, supplier_id, unit_cost, received_date)
        values (_tenant, p_item_id, _wh, p_lot_number, 'lot', p_quantity, p_expiry_date, p_manufacture_date, coalesce(p_supplier_id, _item.supplier_id), p_unit_cost, p_date)
        on conflict (tenant_id, item_id, warehouse_id, lot_number) do update set quantity = public.inventory_lots.quantity + p_quantity,
          expiry_date = coalesce(excluded.expiry_date, public.inventory_lots.expiry_date), manufacture_date = coalesce(excluded.manufacture_date, public.inventory_lots.manufacture_date),
          unit_cost = coalesce(excluded.unit_cost, public.inventory_lots.unit_cost),
          status = case when public.inventory_lots.status = 'consumed' then 'available' else public.inventory_lots.status end, updated_at = now()
        returning id into _lot_id;
    end if;
    insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, supplier_id, warehouse_id, lot_id)
      values (_tenant, p_item_id, 'entrada', p_quantity, p_unit_cost, p_notes, auth.uid(), p_date, p_supplier_id, _wh, _lot_id) returning id into _mv_id;
  end if;
  update public.inventory_items set avg_cost = round(_new_avg, 2), unit_cost = p_unit_cost, last_restock_date = now(),
    supplier_name = coalesce(p_supplier, supplier_name), supplier_id = coalesce(p_supplier_id, supplier_id), updated_at = now()
  where id = p_item_id and tenant_id = _tenant;
  perform public._recalc_item_total_stock(p_item_id);
  return _mv_id;
end $function$;

-- ============ 5. record_shrinkage: consumo FIFO en merma ============
create or replace function public.record_shrinkage(p_item_id uuid, p_qty numeric, p_reason text DEFAULT NULL::text, p_warehouse_id uuid DEFAULT NULL::uuid, p_lot_id uuid DEFAULT NULL::uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _avg numeric; _name text; _track text; _wh uuid; _wq numeric; _mv_id uuid; _lqty numeric; _lwh uuid; _cogs numeric;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'Cantidad inválida'; end if;
  select avg_cost, name, tracking_type into _avg, _name, _track from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  if _track = 'none' then
    _wh := coalesce(p_warehouse_id, public._default_warehouse(_tenant));
    if public._costing_method(_tenant) = 'fifo' then
      _cogs := public._deduct_fifo(p_item_id, _wh, p_qty);
      insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, warehouse_id, cogs_total, cogs_unit)
        values(_tenant, p_item_id, 'merma', p_qty, round(_cogs/p_qty,4), coalesce(nullif(p_reason,''),'Merma'), auth.uid(), current_date, _wh, _cogs, round(_cogs/p_qty,4)) returning id into _mv_id;
      perform public._recalc_item_total_stock(p_item_id);
    else
      select quantity into _wq from public.inventory_stock where item_id = p_item_id and warehouse_id = _wh for update;
      if coalesce(_wq, 0) - p_qty < 0 then raise exception 'Stock insuficiente para %: disponible %, requerido %', _name, coalesce(_wq, 0), p_qty; end if;
      insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, warehouse_id)
        values(_tenant, p_item_id, 'merma', p_qty, _avg, coalesce(nullif(p_reason,''),'Merma'), auth.uid(), current_date, _wh) returning id into _mv_id;
      perform public._add_warehouse_stock(_tenant, p_item_id, _wh, -p_qty);
      perform public._recalc_item_total_stock(p_item_id);
    end if;
  else
    if p_lot_id is null then raise exception 'Lote requerido para este ítem'; end if;
    select quantity, warehouse_id into _lqty, _lwh from public.inventory_lots where id = p_lot_id and item_id = p_item_id and tenant_id = _tenant for update;
    if not found then raise exception 'Lote no encontrado'; end if;
    if _lqty - p_qty < 0 then raise exception 'Stock insuficiente en el lote: disponible %, requerido %', _lqty, p_qty; end if;
    insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, warehouse_id, lot_id)
      values(_tenant, p_item_id, 'merma', p_qty, _avg, coalesce(nullif(p_reason,''),'Merma'), auth.uid(), current_date, _lwh, p_lot_id) returning id into _mv_id;
    update public.inventory_lots set quantity = quantity - p_qty, status = case when quantity - p_qty <= 0 then 'consumed' else status end, updated_at = now() where id = p_lot_id;
  end if;
  return _mv_id;
end $function$;

-- ============ 6. record_stop_supplies: consumo FIFO de insumos en ruta ============
create or replace function public.record_stop_supplies(p_stop_id uuid, p_items jsonb, p_warehouse_id uuid DEFAULT NULL::uuid)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare v_tenant uuid; v_item jsonb; v_item_id uuid; v_qty numeric; v_cost numeric; v_name text; v_track text; v_wh uuid; v_wq numeric; v_cogs numeric;
begin
  select r.tenant_id into v_tenant from route_stops s join service_routes r on r.id = s.route_id where s.id = p_stop_id;
  if v_tenant is null or v_tenant <> current_tenant() then raise exception 'Parada no encontrada'; end if;
  if not can_access_module('routes', 'edit') then raise exception 'No autorizado'; end if;
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

-- ============ 7. confirm_landing_order: COGS real FIFO en venta web ============
create or replace function public.confirm_landing_order(_order_id uuid, _payment_method_id uuid DEFAULT NULL::uuid, _create_invoice boolean DEFAULT true, _note text DEFAULT NULL::text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _o public.tenant_landing_orders%rowtype;
        _cat uuid; _pm uuid; _income uuid; _invoice uuid; _lead uuid; _name text; _phone text; _sub boolean;
        _it jsonb; _inv_id uuid; _qty numeric; _cogs numeric; _pname text; _track text; _wh uuid; _wq numeric; _cogs_layer numeric;
begin
  if not public.is_ceo_or_above() then return jsonb_build_object('status','error','code','forbidden'); end if;
  select * into _o from public.tenant_landing_orders where id = _order_id and tenant_id = _t;
  if not found then return jsonb_build_object('status','error','code','not_found'); end if;
  if _o.status in ('paid','refunded','canceled') then return jsonb_build_object('status','error','code','already_confirmed'); end if;
  _name := coalesce(nullif(trim(_o.customer_name),''),'Cliente web'); _phone := coalesce(_o.customer_phone,'');
  _sub := _o.order_type = 'subscription'; _pm := _payment_method_id;
  if _pm is null then select id into _pm from public.categories where tenant_id=_t and kind='payment_method' and label='Efectivo' limit 1;
    if _pm is null then insert into public.categories(tenant_id,kind,label,sort) values(_t,'payment_method','Efectivo',90) returning id into _pm; end if; end if;
  select id into _cat from public.categories where tenant_id=_t and kind='income' and label='Venta web' limit 1;
  if _cat is null then insert into public.categories(tenant_id,kind,label,sort) values(_t,'income','Venta web',86) returning id into _cat; end if;
  insert into public.income(tenant_id,category_id,payment_method_id,amount,income_date,client_reference,order_number,notes,created_by)
    values(_t,_cat,_pm,_o.total,current_date,_name,_o.order_number,'Orden web '||coalesce(_o.order_number,''),auth.uid()) returning id into _income;
  _lead := _o.linked_lead_id;
  if _lead is null then
    select id into _lead from public.leads where tenant_id=_t and ((_o.customer_email is not null and email=_o.customer_email) or (_phone<>'' and phone=_phone)) limit 1;
    if _lead is null then
      insert into public.leads(tenant_id,contact_name,phone,email,service_requested,lead_source,temperature,status,attended_by)
        values(_t,_name,_phone,_o.customer_email,'Orden web '||coalesce(_o.order_number,''),'order-web','warm','converted',auth.uid()) returning id into _lead;
    end if;
  end if;
  if _create_invoice then
    insert into public.invoices(tenant_id,client_name,phone,email,items,subtotal,tax,total,status,paid_at,payment_method_id,linked_income_id,linked_lead_id,linked_order_id,created_by)
      values(_t,_name,_o.customer_phone,_o.customer_email,_o.items,_o.subtotal,_o.tax,_o.total,'paid',now(),_pm,_income,_lead,_order_id,auth.uid()) returning id into _invoice;
  end if;
  _wh := public._default_warehouse(_t);
  for _it in select * from jsonb_array_elements(coalesce(_o.items,'[]'::jsonb)) loop
    if _it->>'kind' = 'product' then
      _qty := coalesce((_it->>'qty')::numeric, 1);
      select id, coalesce(avg_cost, unit_cost, 0), name, tracking_type into _inv_id, _cogs, _pname, _track
        from public.inventory_items where landing_product_id = (_it->>'id')::uuid and tenant_id = _t for update;
      if _inv_id is not null and _qty > 0 then
        if _track = 'none' then
          if public._costing_method(_t) = 'fifo' then
            _cogs_layer := public._deduct_fifo(_inv_id, _wh, _qty);
            insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, linked_order_id, notes, created_by, movement_date, warehouse_id, cogs_total, cogs_unit)
              values(_t, _inv_id, 'venta_publica', _qty, round(_cogs_layer/_qty,4), _order_id, 'Venta web #'||coalesce(_o.order_number,''), auth.uid(), current_date, _wh, _cogs_layer, round(_cogs_layer/_qty,4));
            perform public._recalc_item_total_stock(_inv_id);
          else
            select quantity into _wq from public.inventory_stock where item_id = _inv_id and warehouse_id = _wh for update;
            if coalesce(_wq, 0) - _qty < 0 then raise exception 'Stock insuficiente para %: disponible %, requerido %', _pname, coalesce(_wq, 0), _qty; end if;
            insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, linked_order_id, notes, created_by, movement_date, warehouse_id)
              values(_t, _inv_id, 'venta_publica', _qty, _cogs, _order_id, 'Venta web #'||coalesce(_o.order_number,''), auth.uid(), current_date, _wh);
            perform public._add_warehouse_stock(_t, _inv_id, _wh, -_qty);
            perform public._recalc_item_total_stock(_inv_id);
          end if;
        else
          perform public._deduct_fefo(_t, _inv_id, _wh, _qty, 'venta_publica', 'Venta web #'||coalesce(_o.order_number,''), _order_id, null);
        end if;
      end if;
    end if;
  end loop;
  perform set_config('app.order_note', coalesce(_note,'Pago confirmado'), true);
  update public.tenant_landing_orders set status='paid', payment_status='paid', paid_at=now(), linked_lead_id=_lead, linked_invoice_id=_invoice, updated_at=now(),
    cycles_paid = case when _sub then _o.cycles_paid + 1 else _o.cycles_paid end,
    last_cycle_paid_at = case when _sub then now() else last_cycle_paid_at end,
    last_cycle_notify_sent_at = case when _sub then null else last_cycle_notify_sent_at end
  where id=_order_id;
  return jsonb_build_object('status','ok','income_id',_income,'invoice_id',_invoice,'lead_id',_lead);
end $function$;

-- ============ 8. _apply_invoice_stock: COGS FIFO en venta / cost_layer de devolución ============
create or replace function public._apply_invoice_stock(_invoice_id uuid, _return boolean)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare _inv record; _line record; _item_id uuid; _cogs numeric; _iname text; _track text; _wh uuid; _wq numeric; _lot_id uuid; _cogs_layer numeric;
  _mtype text := case when _return then 'devolucion' else 'venta_publica' end;
begin
  select id, tenant_id, invoice_number into _inv from public.invoices where id = _invoice_id;
  if not found then return; end if;
  _wh := public._default_warehouse(_inv.tenant_id);
  for _line in select product_id, quantity from public.invoice_line_items where invoice_id = _invoice_id and product_id is not null loop
    select id, coalesce(avg_cost, unit_cost, 0), name, tracking_type into _item_id, _cogs, _iname, _track from public.inventory_items
      where landing_product_id = _line.product_id and tenant_id = _inv.tenant_id for update;
    if _item_id is null then continue; end if;
    if _track = 'none' then
      if public._costing_method(_inv.tenant_id) = 'fifo' then
        if _return then
          _lot_id := gen_random_uuid();
          insert into public.inventory_lots (id, tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, unit_cost, received_date, status, notes)
            values (_lot_id, _inv.tenant_id, _item_id, _wh, 'CL-DEV-'||coalesce(_inv.invoice_number,'?')||'-'||substr(_lot_id::text,1,8), 'cost_layer', _line.quantity, _cogs, current_date, 'available', 'Devolución factura #'||coalesce(_inv.invoice_number,''));
          insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, created_by, warehouse_id, lot_id)
            values (_inv.tenant_id, _item_id, 'devolucion', _line.quantity, _cogs, current_date, 'Reversa factura #'||coalesce(_inv.invoice_number,''), auth.uid(), _wh, _lot_id);
        else
          _cogs_layer := public._deduct_fifo(_item_id, _wh, _line.quantity);
          insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, created_by, warehouse_id, cogs_total, cogs_unit)
            values (_inv.tenant_id, _item_id, 'venta_publica', _line.quantity, round(_cogs_layer/_line.quantity,4), current_date, 'Venta factura #'||coalesce(_inv.invoice_number,''), auth.uid(), _wh, _cogs_layer, round(_cogs_layer/_line.quantity,4));
        end if;
      else
        select quantity into _wq from public.inventory_stock where item_id = _item_id and warehouse_id = _wh for update;
        if not _return and coalesce(_wq, 0) - _line.quantity < 0 then
          raise exception 'Stock insuficiente para %: disponible %, requerido %', _iname, coalesce(_wq, 0), _line.quantity;
        end if;
        insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, created_by, warehouse_id)
          values (_inv.tenant_id, _item_id, _mtype, _line.quantity, _cogs, current_date,
            (case when _return then 'Reversa factura #' else 'Venta factura #' end) || coalesce(_inv.invoice_number, ''), auth.uid(), _wh);
        perform public._add_warehouse_stock(_inv.tenant_id, _item_id, _wh, case when _return then _line.quantity else -_line.quantity end);
        perform public._recalc_item_total_stock(_item_id);
      end if;
    elsif not _return then
      perform public._deduct_fefo(_inv.tenant_id, _item_id, _wh, _line.quantity, 'venta_publica', 'Venta factura #'||coalesce(_inv.invoice_number,''), null, null);
    else
      _lot_id := gen_random_uuid();
      insert into public.inventory_lots (id, tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, unit_cost, status, notes)
        values (_lot_id, _inv.tenant_id, _item_id, _wh, 'DEV-'||coalesce(_inv.invoice_number,'?')||'-'||substr(_lot_id::text,1,8), 'lot', _line.quantity, _cogs, 'available', 'Devolución factura #'||coalesce(_inv.invoice_number,''));
      insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, created_by, warehouse_id, lot_id)
        values (_inv.tenant_id, _item_id, 'devolucion', _line.quantity, _cogs, current_date, 'Reversa factura #'||coalesce(_inv.invoice_number,''), auth.uid(), _wh, _lot_id);
    end if;
  end loop;
end $function$;

-- ============ 9. record_adjustment: reduce=FIFO, aumenta=nueva cost_layer ============
create or replace function public.record_adjustment(p_item_id uuid, p_new_qty numeric, p_reason text DEFAULT NULL::text, p_warehouse_id uuid DEFAULT NULL::uuid, p_lot_id uuid DEFAULT NULL::uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _avg numeric; _name text; _track text; _wh uuid; _wq numeric; _diff numeric; _mv_id uuid; _lqty numeric; _lwh uuid; _cogs_layer numeric; _new_lot uuid;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_new_qty is null then raise exception 'Cantidad inválida'; end if;
  if p_new_qty < 0 then raise exception 'Stock no puede quedar negativo (solicitado: %)', p_new_qty; end if;
  select avg_cost, name, tracking_type into _avg, _name, _track from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  if _track = 'none' then
    _wh := coalesce(p_warehouse_id, public._default_warehouse(_tenant));
    if _wh is null then raise exception 'No hay almacén configurado'; end if;
    select quantity into _wq from public.inventory_stock where item_id = p_item_id and warehouse_id = _wh for update;
    _diff := p_new_qty - coalesce(_wq, 0);
    if _diff = 0 then return null; end if;
    if public._costing_method(_tenant) = 'fifo' then
      if _diff < 0 then
        _cogs_layer := public._deduct_fifo(p_item_id, _wh, -_diff);
        insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, delta, unit_cost, notes, created_by, movement_date, warehouse_id, cogs_total, cogs_unit)
          values(_tenant, p_item_id, 'ajuste', abs(_diff), _diff, round(_cogs_layer/abs(_diff),4), coalesce(nullif(p_reason,''),'Ajuste manual'), auth.uid(), current_date, _wh, _cogs_layer, round(_cogs_layer/abs(_diff),4)) returning id into _mv_id;
      else
        _new_lot := gen_random_uuid();
        insert into public.inventory_lots (id, tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, unit_cost, received_date, status, notes)
          values (_new_lot, _tenant, p_item_id, _wh, 'CL-ADJ-'||substr(_new_lot::text,1,8), 'cost_layer', _diff, coalesce(_avg,0), current_date, 'available', coalesce(nullif(p_reason,''),'Ajuste manual'));
        insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, delta, unit_cost, notes, created_by, movement_date, warehouse_id, lot_id)
          values(_tenant, p_item_id, 'ajuste', abs(_diff), _diff, _avg, coalesce(nullif(p_reason,''),'Ajuste manual'), auth.uid(), current_date, _wh, _new_lot) returning id into _mv_id;
      end if;
      perform public._recalc_item_total_stock(p_item_id);
    else
      insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, delta, unit_cost, notes, created_by, movement_date, warehouse_id)
        values(_tenant, p_item_id, 'ajuste', abs(_diff), _diff, _avg, coalesce(nullif(p_reason,''),'Ajuste manual'), auth.uid(), current_date, _wh) returning id into _mv_id;
      insert into public.inventory_stock (tenant_id, item_id, warehouse_id, quantity) values (_tenant, p_item_id, _wh, p_new_qty)
        on conflict (item_id, warehouse_id) do update set quantity = p_new_qty, updated_at = now();
      perform public._recalc_item_total_stock(p_item_id);
    end if;
  else
    if p_lot_id is null then raise exception 'Lote requerido para este ítem'; end if;
    select quantity, warehouse_id into _lqty, _lwh from public.inventory_lots where id = p_lot_id and item_id = p_item_id and tenant_id = _tenant for update;
    if not found then raise exception 'Lote no encontrado'; end if;
    _diff := p_new_qty - _lqty;
    if _diff = 0 then return null; end if;
    insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, delta, unit_cost, notes, created_by, movement_date, warehouse_id, lot_id)
      values(_tenant, p_item_id, 'ajuste', abs(_diff), _diff, _avg, coalesce(nullif(p_reason,''),'Ajuste manual'), auth.uid(), current_date, _lwh, p_lot_id) returning id into _mv_id;
    update public.inventory_lots set quantity = p_new_qty, status = case when p_new_qty <= 0 then 'consumed' else 'available' end, updated_at = now() where id = p_lot_id;
  end if;
  return _mv_id;
end $function$;

-- ============ 10. _seed_item_stock: capa base al crear ítem 'none' con stock inicial en tenant fifo ============
create or replace function public._seed_item_stock()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare _wh uuid;
begin
  _wh := public._default_warehouse(NEW.tenant_id);
  if _wh is not null then
    insert into public.inventory_stock (tenant_id, item_id, warehouse_id, quantity, min_stock, reorder_point, reorder_qty, location_zone, location_aisle, location_shelf, location_bin)
      values (NEW.tenant_id, NEW.id, _wh, coalesce(NEW.stock, 0), NEW.min_stock, NEW.reorder_point, NEW.reorder_qty, NEW.warehouse_zone, NEW.aisle, NEW.shelf, NEW.bin)
    on conflict (item_id, warehouse_id) do nothing;
    if coalesce(NEW.stock, 0) > 0 and coalesce(NEW.tracking_type, 'none') = 'none' and public._costing_method(NEW.tenant_id) = 'fifo' then
      insert into public.inventory_lots (tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, unit_cost, received_date, status)
        values (NEW.tenant_id, NEW.id, _wh, 'CL-INIT-'||substr(NEW.id::text,1,8), 'cost_layer', NEW.stock, coalesce(NEW.avg_cost, NEW.unit_cost, 0), current_date, 'available')
      on conflict (tenant_id, item_id, warehouse_id, lot_number) do nothing;
    end if;
  end if;
  return NEW;
end $function$;

-- ============ 11. _migrate_to_fifo: snapshot del stock actual como capa base ============
-- Uso (en una transacción): update tenants set costing_method='fifo' where id=X; select _migrate_to_fifo(X);
create or replace function public._migrate_to_fifo(p_tenant_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  insert into public.inventory_lots (tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, received_date, unit_cost, status)
  select s.tenant_id, s.item_id, s.warehouse_id, 'CL-MIGRATION-'||s.warehouse_id::text, 'cost_layer', s.quantity, current_date, coalesce(i.avg_cost, i.unit_cost, 0), 'available'
  from public.inventory_stock s
  join public.inventory_items i on i.id = s.item_id
  where s.tenant_id = p_tenant_id and i.tracking_type = 'none' and s.quantity > 0
    and not exists (select 1 from public.inventory_lots l
      where l.item_id = s.item_id and l.warehouse_id = s.warehouse_id
        and l.status = 'available' and l.lot_type in ('lot', 'cost_layer'))
  on conflict (tenant_id, item_id, warehouse_id, lot_number) do nothing;
end $function$;
revoke execute on function public._migrate_to_fifo(uuid) from public, anon, authenticated;
