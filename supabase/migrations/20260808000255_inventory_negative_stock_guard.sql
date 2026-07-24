-- 20260808000255 · Inventory Gap Fix #1
-- (1) Guard de stock negativo en TODAS las RPCs que restan stock (nunca queda < 0).
-- (2) Limpieza: dropea inventory_movements.linked_expense_id (columna + FK MUERTA — el enlace real
--     vive al revés en expenses.linked_inventory_movement_id; verificado 0 filas no-null).
-- NO se toca credit_balance: está cableada al form de proveedores (input + repo read/write), no es dead code.
-- Solo se AÑADE el guard; se respetan parámetros, gates de permiso y lógica existente de cada función.
--
-- Tests manuales (ejecutar en rollback tx):
--   record_shrinkage(item, qty > stock)   → debe fallar 'Stock insuficiente...'
--   record_adjustment(item, p_new_qty=-1) → debe fallar 'Stock no puede quedar negativo'
--   record_restock(entrada)               → NO lleva guard (las entradas siempre suman)
--   confirm_landing_order / _apply_invoice_stock con qty > stock → deben fallar y hacer rollback total

-- ── record_adjustment (base migr 230): separa null vs negativo con mensaje claro ────────────────────
create or replace function public.record_adjustment(p_item_id uuid, p_new_qty numeric, p_reason text default null)
 returns uuid language plpgsql security definer set search_path to 'public'
as $function$
declare _tenant uuid := current_tenant(); _item public.inventory_items%rowtype; _diff numeric; _mv_id uuid;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_new_qty is null then raise exception 'Cantidad inválida'; end if;
  if p_new_qty < 0 then raise exception 'Stock no puede quedar negativo (solicitado: %)', p_new_qty; end if;
  select * into _item from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  _diff := p_new_qty - _item.stock;
  if _diff = 0 then return null; end if;
  insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, delta, unit_cost, notes, created_by, movement_date)
    values(_tenant, p_item_id, 'ajuste', abs(_diff), _diff, _item.avg_cost, coalesce(nullif(p_reason,''),'Ajuste manual'), auth.uid(), current_date)
    returning id into _mv_id;
  update public.inventory_items set stock = p_new_qty, updated_at = now() where id = p_item_id and tenant_id = _tenant;
  if _item.landing_product_id is not null then
    update public.tenant_landing_products set stock_quantity = p_new_qty, updated_at = now() where id = _item.landing_product_id and tenant_id = _tenant;
  end if;
  return _mv_id;
end $function$;

-- ── record_shrinkage (base migr 179): añade guard stock - qty >= 0 ───────────────────────────────────
create or replace function public.record_shrinkage(p_item_id uuid, p_qty numeric, p_reason text default null)
 returns uuid language plpgsql security definer set search_path to 'public'
as $function$
declare _tenant uuid := current_tenant(); _item public.inventory_items%rowtype; _mv_id uuid;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'Cantidad inválida'; end if;
  select * into _item from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  if _item.stock - p_qty < 0 then
    raise exception 'Stock insuficiente para %: disponible %, requerido %', _item.name, _item.stock, p_qty;
  end if;
  insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date)
    values(_tenant, p_item_id, 'merma', p_qty, _item.avg_cost, coalesce(nullif(p_reason,''),'Merma'), auth.uid(), current_date)
    returning id into _mv_id;
  update public.inventory_items set stock = stock - p_qty, updated_at = now() where id = p_item_id and tenant_id = _tenant;
  if _item.landing_product_id is not null then
    update public.tenant_landing_products set stock_quantity = _item.stock - p_qty, updated_at = now() where id = _item.landing_product_id and tenant_id = _tenant;
  end if;
  return _mv_id;
end $function$;

-- ── record_stop_supplies (base migr 073): ya validaba qty > stock; estandariza el mensaje con nombre ──
create or replace function public.record_stop_supplies(p_stop_id uuid, p_items jsonb)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_tenant uuid; v_item jsonb; v_item_id uuid; v_qty numeric; v_stock numeric; v_cost numeric; v_name text;
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
    select stock, unit_cost, name into v_stock, v_cost, v_name
      from inventory_items where id = v_item_id and tenant_id = v_tenant for update;
    if v_stock is null then raise exception 'Insumo no encontrado'; end if;
    if v_stock - v_qty < 0 then
      raise exception 'Stock insuficiente para %: disponible %, requerido %', v_name, v_stock, v_qty;
    end if;
    insert into inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, linked_stop_id, created_by)
      values (v_tenant, v_item_id, 'salida', v_qty, v_cost, current_date, 'Insumo de ruta', p_stop_id, auth.uid());
    update inventory_items set stock = stock - v_qty, updated_at = now() where id = v_item_id;
  end loop;
end $function$;

-- ── confirm_landing_order (base migr 230): guard stock antes del descuento por venta_publica ─────────
create or replace function public.confirm_landing_order(_order_id uuid, _payment_method_id uuid default null, _create_invoice boolean default true, _note text default null)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _o public.tenant_landing_orders%rowtype;
        _cat uuid; _pm uuid; _income uuid; _invoice uuid; _lead uuid; _name text; _phone text; _sub boolean;
        _it jsonb; _inv_id uuid; _qty numeric; _cogs numeric; _stock numeric; _pname text;
begin
  if not public.is_ceo_or_above() then return jsonb_build_object('status','error','code','forbidden'); end if;
  select * into _o from public.tenant_landing_orders where id = _order_id and tenant_id = _t;
  if not found then return jsonb_build_object('status','error','code','not_found'); end if;
  if _o.status in ('paid','refunded','canceled') then return jsonb_build_object('status','error','code','already_confirmed'); end if;
  _name := coalesce(nullif(trim(_o.customer_name),''),'Cliente web'); _phone := coalesce(_o.customer_phone,'');
  _sub := _o.order_type = 'subscription';
  _pm := _payment_method_id;
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
  -- BLOQUE 3: descuento de stock + COGS (avg_cost vigente) por productos vendidos vinculados a inventario
  for _it in select * from jsonb_array_elements(coalesce(_o.items,'[]'::jsonb)) loop
    if _it->>'kind' = 'product' then
      _qty := coalesce((_it->>'qty')::numeric, 1);
      select id, coalesce(avg_cost, unit_cost, 0), stock, name into _inv_id, _cogs, _stock, _pname
        from public.inventory_items where landing_product_id = (_it->>'id')::uuid and tenant_id = _t for update;
      if _inv_id is not null and _qty > 0 then
        if _stock - _qty < 0 then
          raise exception 'Stock insuficiente para %: disponible %, requerido %', _pname, _stock, _qty;
        end if;
        insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, linked_order_id, notes, created_by, movement_date)
          values(_t, _inv_id, 'venta_publica', _qty, _cogs, _order_id, 'Venta web #'||coalesce(_o.order_number,''), auth.uid(), current_date);
        update public.inventory_items set stock = stock - _qty, updated_at = now() where id = _inv_id and tenant_id = _t;
        update public.tenant_landing_products set stock_quantity = (select stock from public.inventory_items where id = _inv_id), updated_at = now()
          where id = (_it->>'id')::uuid and tenant_id = _t;
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

-- ── _apply_invoice_stock (base migr 235): guard SOLO en deducción (_return=false) ────────────────────
create or replace function public._apply_invoice_stock(_invoice_id uuid, _return boolean)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare
  _inv record; _line record; _item_id uuid; _cogs numeric; _new_stock numeric; _stock numeric; _iname text;
  _mtype text := case when _return then 'devolucion' else 'venta_publica' end;
begin
  select id, tenant_id, invoice_number into _inv from public.invoices where id = _invoice_id;
  if not found then return; end if;
  for _line in select product_id, quantity from public.invoice_line_items
    where invoice_id = _invoice_id and product_id is not null loop
    select id, coalesce(avg_cost, unit_cost, 0), stock, name into _item_id, _cogs, _stock, _iname from public.inventory_items
      where landing_product_id = _line.product_id and tenant_id = _inv.tenant_id for update;
    if _item_id is null then continue; end if;  -- producto sin inventory_item → no lleva stock
    if not _return and _stock - _line.quantity < 0 then
      raise exception 'Stock insuficiente para %: disponible %, requerido %', _iname, _stock, _line.quantity;
    end if;
    insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, created_by)
      values (_inv.tenant_id, _item_id, _mtype, _line.quantity, _cogs, current_date,
        (case when _return then 'Reversa factura #' else 'Venta factura #' end) || coalesce(_inv.invoice_number, ''), auth.uid());
    update public.inventory_items
      set stock = stock + (case when _return then _line.quantity else -_line.quantity end), updated_at = now()
      where id = _item_id returning stock into _new_stock;
    update public.tenant_landing_products set stock_quantity = _new_stock, updated_at = now()
      where id = _line.product_id and tenant_id = _inv.tenant_id;
  end loop;
end $function$;

-- ── (2) Limpieza de columna muerta: inventory_movements.linked_expense_id ─────────────────────────────
alter table public.inventory_movements drop constraint if exists inventory_movements_linked_expense_id_fkey;
alter table public.inventory_movements drop column if exists linked_expense_id;
