-- 230 · Ola 2.2b · Kardex saldo corrido (delta firmado) + COGS en la venta.
--
-- inventory_movements.quantity siempre es >0 (CHECK) → la dirección no se guardaba (ajuste +5 vs -5 indistinguible).
-- Añadimos `delta` firmado (immutable por fila) → saldo corrido = sum(delta) over(...) AL VUELO (sobrevive soft-deletes;
-- materializar balance_after se desincronizaría). Un trigger BEFORE INSERT deriva delta por tipo cuando es NULL (cubre
-- los 5 tipos inequívocos); solo record_adjustment lo setea explícito con el _diff FIRMADO que ya calcula.
-- COGS: la venta (venta_publica) grababa unit_cost=0 → ahora lee avg_cost con FOR UPDATE. avg_cost NO cambia al vender
-- (solo en restock). 100% ADITIVO: nada lee COGS hoy (reportes = ingreso-gasto), así que ningún número actual se mueve.

-- 1. Columna delta + backfill (11 movimientos hoy, todos 'salida' → -qty)
alter table public.inventory_movements add column if not exists delta numeric;
update public.inventory_movements set delta = case movement_type
  when 'entrada' then quantity when 'devolucion' then quantity
  when 'salida' then -quantity when 'venta_publica' then -quantity when 'merma' then -quantity
  when 'transferencia' then 0 else quantity end
where delta is null;

-- 2. Trigger: rellena delta por tipo cuando la RPC no lo setea (los tipos inequívocos). 'ajuste' lo setea la RPC.
create or replace function public._inventory_movement_delta() returns trigger language plpgsql as $$
begin
  if new.delta is null then
    new.delta := case new.movement_type
      when 'entrada' then new.quantity when 'devolucion' then new.quantity
      when 'salida' then -new.quantity when 'venta_publica' then -new.quantity when 'merma' then -new.quantity
      when 'transferencia' then 0 else new.quantity end;
  end if;
  return new;
end $$;
drop trigger if exists trg_inventory_movement_delta on public.inventory_movements;
create trigger trg_inventory_movement_delta before insert on public.inventory_movements
  for each row execute function public._inventory_movement_delta();

-- 3. record_adjustment: graba delta = _diff FIRMADO (resuelve la ambigüedad de dirección del ajuste).
create or replace function public.record_adjustment(p_item_id uuid, p_new_qty numeric, p_reason text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _item public.inventory_items%rowtype; _diff numeric; _mv_id uuid;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_new_qty is null or p_new_qty < 0 then raise exception 'Cantidad inválida'; end if;
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

-- 4. confirm_landing_order: captura COGS (avg_cost vigente, FOR UPDATE) en el movimiento venta_publica. delta lo pone el trigger.
create or replace function public.confirm_landing_order(_order_id uuid, _payment_method_id uuid default null, _create_invoice boolean default true, _note text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _o public.tenant_landing_orders%rowtype;
        _cat uuid; _pm uuid; _income uuid; _invoice uuid; _lead uuid; _name text; _phone text; _sub boolean;
        _it jsonb; _inv_id uuid; _qty numeric; _cogs numeric;
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
      select id, coalesce(avg_cost, unit_cost, 0) into _inv_id, _cogs
        from public.inventory_items where landing_product_id = (_it->>'id')::uuid and tenant_id = _t for update;
      if _inv_id is not null and _qty > 0 then
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

-- 5. list_item_movements: + delta + unit_cost (gateado por inventory.cost) + saldo corrido (sum window, excluye borrados).
drop function if exists public.list_item_movements(uuid);
create function public.list_item_movements(p_item_id uuid)
returns table(id uuid, movement_type text, quantity numeric, delta numeric, unit_cost numeric, running_balance numeric,
  movement_date date, notes text, employee text, client_name text, service_type text, route_date date)
language sql stable security definer set search_path to 'public' as $function$
  select x.id, x.movement_type, x.quantity, x.delta,
    case when public.can_access_module('inventory','cost') then x.unit_cost else null end as unit_cost,
    x.running_balance, x.movement_date, x.notes, x.employee, x.client_name, x.service_type, x.route_date
  from (
    select m.id, m.movement_type, m.quantity, coalesce(m.delta,0) as delta, m.unit_cost, m.movement_date, m.created_at, m.notes,
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
grant execute on function public.list_item_movements(uuid) to authenticated;
