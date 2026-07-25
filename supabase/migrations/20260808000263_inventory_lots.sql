-- 20260808000263 · Inventory Gap Fix #7 — Lotes / Serie / Caducidad (Parte 1: backend)
-- Capa de trazabilidad OPCIONAL por ítem (tracking_type). Backward compatible: los 36 ítems quedan 'none'.
-- Invariante de 3 capas: SUM(lots.qty available/quarantine por almacén) = inventory_stock.quantity = base de inventory_items.stock.
-- DECISIONES (vs brief): (1) unique incluye warehouse_id → permite partir un lote entre almacenes.
--   (2) _sync_lot_stock hace UPSERT de inventory_stock. (3) FEFO aplica también a 'serial' en rutas automáticas.

alter table public.inventory_items add column if not exists tracking_type text not null default 'none' check (tracking_type in ('none','lot','serial'));

create table public.inventory_lots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id),
  lot_number text not null,
  lot_type text not null check (lot_type in ('lot','serial')),
  quantity numeric not null default 0 check (quantity >= 0),
  expiry_date date, manufacture_date date, received_date date default current_date,
  supplier_id uuid references public.inventory_suppliers(id),
  unit_cost numeric,
  status text not null default 'available' check (status in ('available','quarantine','expired','consumed','recalled')),
  notes text, created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (tenant_id, item_id, warehouse_id, lot_number),
  check (lot_type <> 'serial' or quantity <= 1)
);
alter table public.inventory_movements add column if not exists lot_id uuid references public.inventory_lots(id);

alter table public.inventory_lots enable row level security;
create policy inv_lots_select on public.inventory_lots for select to authenticated using (tenant_id = current_tenant());
create policy inv_lots_insert on public.inventory_lots for insert to authenticated with check (tenant_id = current_tenant() and can_access_module('inventory','edit'));
create policy inv_lots_update on public.inventory_lots for update to authenticated using (tenant_id = current_tenant() and can_access_module('inventory','edit'));
create policy inv_lots_delete on public.inventory_lots for delete to authenticated using (tenant_id = current_tenant() and can_access_module('inventory','delete'));
create trigger trg_updated_at before update on public.inventory_lots for each row execute function public.set_updated_at();

-- Marca lotes vencidos (llamable desde el frontend / cron; tenant-scoped). Devuelve cuántos expiró.
create or replace function public._expire_inventory_lots() returns integer language plpgsql security definer set search_path to 'public' as $$
declare _n integer;
begin
  update public.inventory_lots set status = 'expired', updated_at = now()
    where tenant_id = current_tenant() and status = 'available' and expiry_date is not null and expiry_date < current_date;
  get diagnostics _n = row_count; return _n;
end $$;

-- Invariante: al cambiar lotes, recalcula inventory_stock del almacén (UPSERT) + el total del ítem.
create or replace function public._sync_lot_stock() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _item uuid := coalesce(new.item_id, old.item_id); _wh uuid := coalesce(new.warehouse_id, old.warehouse_id); _tenant uuid := coalesce(new.tenant_id, old.tenant_id);
begin
  insert into public.inventory_stock (tenant_id, item_id, warehouse_id, quantity)
    values (_tenant, _item, _wh, coalesce((select sum(quantity) from public.inventory_lots where item_id=_item and warehouse_id=_wh and status in ('available','quarantine')),0))
    on conflict (item_id, warehouse_id) do update set quantity = excluded.quantity, updated_at = now();
  if tg_op = 'UPDATE' and old.warehouse_id <> new.warehouse_id then
    insert into public.inventory_stock (tenant_id, item_id, warehouse_id, quantity)
      values (old.tenant_id, old.item_id, old.warehouse_id, coalesce((select sum(quantity) from public.inventory_lots where item_id=old.item_id and warehouse_id=old.warehouse_id and status in ('available','quarantine')),0))
      on conflict (item_id, warehouse_id) do update set quantity = excluded.quantity, updated_at = now();
  end if;
  perform public._recalc_item_total_stock(_item);
  return coalesce(new, old);
end $$;
create trigger trg_sync_lot_stock after insert or update or delete on public.inventory_lots for each row execute function public._sync_lot_stock();

-- FEFO: consume p_qty de los lotes disponibles (vence primero → recibido primero). Un movimiento por lote consumido.
create or replace function public._deduct_fefo(p_tenant uuid, p_item uuid, p_warehouse uuid, p_qty numeric, p_mtype text, p_notes text, p_order uuid default null, p_stop uuid default null) returns void language plpgsql security definer set search_path to 'public' as $$
declare _rem numeric := p_qty; _l record; _take numeric; _avg numeric;
begin
  select coalesce(avg_cost, unit_cost, 0) into _avg from public.inventory_items where id = p_item;
  for _l in select id, quantity, unit_cost from public.inventory_lots
    where item_id = p_item and warehouse_id = p_warehouse and status = 'available' and quantity > 0
    order by expiry_date asc nulls last, received_date asc, created_at asc for update loop
    exit when _rem <= 0;
    _take := least(_rem, _l.quantity);
    insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, created_by, warehouse_id, lot_id, linked_order_id, linked_stop_id)
      values (p_tenant, p_item, p_mtype, _take, coalesce(_l.unit_cost, _avg), current_date, p_notes, auth.uid(), p_warehouse, _l.id, p_order, p_stop);
    update public.inventory_lots set quantity = quantity - _take, status = case when quantity - _take <= 0 then 'consumed' else status end, updated_at = now() where id = _l.id;
    _rem := _rem - _take;
  end loop;
  if _rem > 0 then raise exception 'Stock insuficiente en lotes: faltan %', _rem; end if;
end $$;
revoke execute on function public._deduct_fefo(uuid, uuid, uuid, numeric, text, text, uuid, uuid) from public, anon, authenticated;

-- ── RPCs con soporte de lote ──────────────────────────────────────────────────────────────────────────
drop function if exists public.record_restock(uuid, numeric, numeric, text, text, date, uuid, uuid);
create or replace function public.record_restock(p_item_id uuid, p_quantity numeric, p_unit_cost numeric, p_supplier text default null, p_notes text default null, p_date date default current_date, p_supplier_id uuid default null, p_warehouse_id uuid default null, p_lot_number text default null, p_expiry_date date default null, p_manufacture_date date default null)
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
    insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, supplier_id, warehouse_id)
      values (_tenant, p_item_id, 'entrada', p_quantity, p_unit_cost, p_notes, auth.uid(), p_date, p_supplier_id, _wh) returning id into _mv_id;
    perform public._add_warehouse_stock(_tenant, p_item_id, _wh, p_quantity);
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

drop function if exists public.record_shrinkage(uuid, numeric, text, uuid);
create or replace function public.record_shrinkage(p_item_id uuid, p_qty numeric, p_reason text default null, p_warehouse_id uuid default null, p_lot_id uuid default null)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _avg numeric; _name text; _track text; _wh uuid; _wq numeric; _mv_id uuid; _lqty numeric; _lwh uuid;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'Cantidad inválida'; end if;
  select avg_cost, name, tracking_type into _avg, _name, _track from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  if _track = 'none' then
    _wh := coalesce(p_warehouse_id, public._default_warehouse(_tenant));
    select quantity into _wq from public.inventory_stock where item_id = p_item_id and warehouse_id = _wh for update;
    if coalesce(_wq, 0) - p_qty < 0 then raise exception 'Stock insuficiente para %: disponible %, requerido %', _name, coalesce(_wq, 0), p_qty; end if;
    insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, warehouse_id)
      values(_tenant, p_item_id, 'merma', p_qty, _avg, coalesce(nullif(p_reason,''),'Merma'), auth.uid(), current_date, _wh) returning id into _mv_id;
    perform public._add_warehouse_stock(_tenant, p_item_id, _wh, -p_qty);
    perform public._recalc_item_total_stock(p_item_id);
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

drop function if exists public.record_adjustment(uuid, numeric, text, uuid);
create or replace function public.record_adjustment(p_item_id uuid, p_new_qty numeric, p_reason text default null, p_warehouse_id uuid default null, p_lot_id uuid default null)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _avg numeric; _name text; _track text; _wh uuid; _wq numeric; _diff numeric; _mv_id uuid; _lqty numeric; _lwh uuid;
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
    insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, delta, unit_cost, notes, created_by, movement_date, warehouse_id)
      values(_tenant, p_item_id, 'ajuste', abs(_diff), _diff, _avg, coalesce(nullif(p_reason,''),'Ajuste manual'), auth.uid(), current_date, _wh) returning id into _mv_id;
    insert into public.inventory_stock (tenant_id, item_id, warehouse_id, quantity) values (_tenant, p_item_id, _wh, p_new_qty)
      on conflict (item_id, warehouse_id) do update set quantity = p_new_qty, updated_at = now();
    perform public._recalc_item_total_stock(p_item_id);
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

drop function if exists public.transfer_stock(uuid, numeric, uuid, uuid, text);
create or replace function public.transfer_stock(p_item_id uuid, p_qty numeric, p_from_warehouse_id uuid, p_to_warehouse_id uuid, p_notes text default null, p_lot_transfers jsonb default null)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _avg numeric; _name text; _track text; _wq numeric; _mv uuid; _lt jsonb; _lot record; _tq numeric;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'Cantidad inválida'; end if;
  if p_from_warehouse_id = p_to_warehouse_id then raise exception 'Almacén origen y destino iguales'; end if;
  select avg_cost, name, tracking_type into _avg, _name, _track from public.inventory_items where id = p_item_id and tenant_id = _tenant;
  if not found then raise exception 'Item no encontrado'; end if;
  if _track = 'none' then
    select quantity into _wq from public.inventory_stock where item_id = p_item_id and warehouse_id = p_from_warehouse_id for update;
    if coalesce(_wq, 0) - p_qty < 0 then raise exception 'Stock insuficiente en origen para %: disponible %, requerido %', _name, coalesce(_wq, 0), p_qty; end if;
    insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, warehouse_id, to_warehouse_id, notes, created_by, movement_date)
      values(_tenant, p_item_id, 'transferencia', p_qty, coalesce(_avg, 0), p_from_warehouse_id, p_to_warehouse_id, p_notes, auth.uid(), current_date) returning id into _mv;
    perform public._add_warehouse_stock(_tenant, p_item_id, p_from_warehouse_id, -p_qty);
    perform public._add_warehouse_stock(_tenant, p_item_id, p_to_warehouse_id, p_qty);
    perform public._recalc_item_total_stock(p_item_id);
  else
    if p_lot_transfers is null then raise exception 'Especifica los lotes a transferir'; end if;
    for _lt in select * from jsonb_array_elements(p_lot_transfers) loop
      _tq := (_lt->>'qty')::numeric;
      select * into _lot from public.inventory_lots where id = (_lt->>'lot_id')::uuid and item_id = p_item_id and warehouse_id = p_from_warehouse_id for update;
      if not found then raise exception 'Lote no encontrado en el almacén origen'; end if;
      if _tq is null or _tq <= 0 or _tq > _lot.quantity then raise exception 'Cantidad inválida para el lote %', _lot.lot_number; end if;
      insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, warehouse_id, to_warehouse_id, notes, created_by, movement_date, lot_id)
        values(_tenant, p_item_id, 'transferencia', _tq, coalesce(_lot.unit_cost, _avg, 0), p_from_warehouse_id, p_to_warehouse_id, p_notes, auth.uid(), current_date, _lot.id) returning id into _mv;
      if _tq >= _lot.quantity then
        update public.inventory_lots set warehouse_id = p_to_warehouse_id, updated_at = now() where id = _lot.id;
      else
        update public.inventory_lots set quantity = quantity - _tq, updated_at = now() where id = _lot.id;
        insert into public.inventory_lots (tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, expiry_date, manufacture_date, supplier_id, unit_cost, received_date, status)
          values (_tenant, p_item_id, p_to_warehouse_id, _lot.lot_number, _lot.lot_type, _tq, _lot.expiry_date, _lot.manufacture_date, _lot.supplier_id, _lot.unit_cost, _lot.received_date, _lot.status)
          on conflict (tenant_id, item_id, warehouse_id, lot_number) do update set quantity = public.inventory_lots.quantity + _tq, updated_at = now();
      end if;
    end loop;
  end if;
  return _mv;
end $function$;

-- confirm_landing_order: BLOQUE 3 → FEFO para ítems con trazabilidad (resto idéntico).
create or replace function public.confirm_landing_order(_order_id uuid, _payment_method_id uuid default null, _create_invoice boolean default true, _note text default null)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _o public.tenant_landing_orders%rowtype;
        _cat uuid; _pm uuid; _income uuid; _invoice uuid; _lead uuid; _name text; _phone text; _sub boolean;
        _it jsonb; _inv_id uuid; _qty numeric; _cogs numeric; _pname text; _track text; _wh uuid; _wq numeric;
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
          select quantity into _wq from public.inventory_stock where item_id = _inv_id and warehouse_id = _wh for update;
          if coalesce(_wq, 0) - _qty < 0 then raise exception 'Stock insuficiente para %: disponible %, requerido %', _pname, coalesce(_wq, 0), _qty; end if;
          insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, linked_order_id, notes, created_by, movement_date, warehouse_id)
            values(_t, _inv_id, 'venta_publica', _qty, _cogs, _order_id, 'Venta web #'||coalesce(_o.order_number,''), auth.uid(), current_date, _wh);
          perform public._add_warehouse_stock(_t, _inv_id, _wh, -_qty);
          perform public._recalc_item_total_stock(_inv_id);
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

-- _apply_invoice_stock: FEFO en deducción para ítems con trazabilidad; devolución de ítem con lote → pendiente (Parte 2).
create or replace function public._apply_invoice_stock(_invoice_id uuid, _return boolean)
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare _inv record; _line record; _item_id uuid; _cogs numeric; _iname text; _track text; _wh uuid; _wq numeric;
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
      select quantity into _wq from public.inventory_stock where item_id = _item_id and warehouse_id = _wh for update;
      if not _return and coalesce(_wq, 0) - _line.quantity < 0 then
        raise exception 'Stock insuficiente para %: disponible %, requerido %', _iname, coalesce(_wq, 0), _line.quantity;
      end if;
      insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, created_by, warehouse_id)
        values (_inv.tenant_id, _item_id, _mtype, _line.quantity, _cogs, current_date,
          (case when _return then 'Reversa factura #' else 'Venta factura #' end) || coalesce(_inv.invoice_number, ''), auth.uid(), _wh);
      perform public._add_warehouse_stock(_inv.tenant_id, _item_id, _wh, case when _return then _line.quantity else -_line.quantity end);
      perform public._recalc_item_total_stock(_item_id);
    elsif not _return then
      perform public._deduct_fefo(_inv.tenant_id, _item_id, _wh, _line.quantity, 'venta_publica', 'Venta factura #'||coalesce(_inv.invoice_number,''), null, null);
    else
      raise exception 'Devolución de factura con ítem por lote: especifica el lote (pendiente Parte 2)';
    end if;
  end loop;
end $function$;

-- record_stop_supplies: FEFO para ítems con trazabilidad.
create or replace function public.record_stop_supplies(p_stop_id uuid, p_items jsonb, p_warehouse_id uuid default null)
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare v_tenant uuid; v_item jsonb; v_item_id uuid; v_qty numeric; v_cost numeric; v_name text; v_track text; v_wh uuid; v_wq numeric;
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
      select quantity into v_wq from public.inventory_stock where item_id = v_item_id and warehouse_id = v_wh for update;
      if coalesce(v_wq, 0) - v_qty < 0 then raise exception 'Stock insuficiente para %: disponible %, requerido %', v_name, coalesce(v_wq, 0), v_qty; end if;
      insert into inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, linked_stop_id, created_by, warehouse_id)
        values (v_tenant, v_item_id, 'salida', v_qty, v_cost, current_date, 'Insumo de ruta', p_stop_id, auth.uid(), v_wh);
      perform public._add_warehouse_stock(v_tenant, v_item_id, v_wh, -v_qty);
      perform public._recalc_item_total_stock(v_item_id);
    else
      perform public._deduct_fefo(v_tenant, v_item_id, v_wh, v_qty, 'salida', 'Insumo de ruta', null, p_stop_id);
    end if;
  end loop;
end $function$;

-- receive_purchase_order: propaga lote/caducidad de cada línea a record_restock.
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
    _mv := public.record_restock(_item_id, _rq, _cost, null, 'Recepción PO', current_date, _po.supplier_id, _wh, nullif(_it->>'lot_number',''), (_it->>'expiry_date')::date, (_it->>'manufacture_date')::date);
    update public.inventory_movements set linked_restock_id = p_order_id where id = _mv;
  end loop;
  select bool_and(received_qty >= quantity) into _all from public.inventory_purchase_order_items where order_id = p_order_id;
  update public.inventory_purchase_orders set status = case when _all then 'received' else 'partial' end,
    received_at = case when _all then now() else received_at end, updated_at = now() where id = p_order_id;
  return jsonb_build_object('status', case when _all then 'received' else 'partial' end);
end $function$;
