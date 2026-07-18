-- inventory-complete (bloque 3) — venta pública descuenta stock + RPCs de ajuste y merma.
-- confirm_landing_order (revenue-critical): tras crear income/invoice/lead, recorre order.items; por cada kind='product'
-- vinculado a un inventory_item (landing_product_id) inserta 'venta_publica' (qty POSITIVA, respeta CHECK>0), resta stock
-- y sincroniza tenant_landing_products.stock_quantity. Sin item vinculado → no toca inventario (no rompe la venta).
-- Stock puede quedar <0 (no bloquea la venta; el badge de stock bajo lo refleja). El trigger auto_expense solo dispara
-- en 'entrada', así que venta_publica NO crea gasto. record_adjustment/record_shrinkage: movimientos manuales de stock.

create or replace function public.confirm_landing_order(_order_id uuid, _payment_method_id uuid default null::uuid, _create_invoice boolean default true, _note text default null::text)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _o public.tenant_landing_orders%rowtype;
        _cat uuid; _pm uuid; _income uuid; _invoice uuid; _lead uuid; _name text; _phone text; _sub boolean;
        _it jsonb; _inv_id uuid; _qty numeric;
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
        values(_t,_name,_phone,_o.customer_email,'Orden web '||coalesce(_o.order_number,''),'order-web','warm','Convertido',auth.uid()) returning id into _lead;
    end if;
  end if;
  if _create_invoice then
    insert into public.invoices(tenant_id,client_name,phone,email,items,subtotal,tax,total,status,paid_at,payment_method_id,linked_income_id,linked_lead_id,linked_order_id,created_by)
      values(_t,_name,_o.customer_phone,_o.customer_email,_o.items,_o.subtotal,_o.tax,_o.total,'paid',now(),_pm,_income,_lead,_order_id,auth.uid()) returning id into _invoice;
  end if;
  -- BLOQUE 3: descuento de stock por productos vendidos vinculados a inventario
  for _it in select * from jsonb_array_elements(coalesce(_o.items,'[]'::jsonb)) loop
    if _it->>'kind' = 'product' then
      _qty := coalesce((_it->>'qty')::numeric, 1);
      select id into _inv_id from public.inventory_items where landing_product_id = (_it->>'id')::uuid and tenant_id = _t;
      if _inv_id is not null and _qty > 0 then
        insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, linked_order_id, notes, created_by, movement_date)
          values(_t, _inv_id, 'venta_publica', _qty, 0, _order_id, 'Venta web #'||coalesce(_o.order_number,''), auth.uid(), current_date);
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

-- RPC record_adjustment: fija el stock a p_new_qty; registra 'ajuste' con la diferencia (abs, qty>0) + sync landing.
create or replace function public.record_adjustment(p_item_id uuid, p_new_qty numeric, p_reason text default null)
 returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _tenant uuid := current_tenant(); _item public.inventory_items%rowtype; _diff numeric; _mv_id uuid;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_new_qty is null or p_new_qty < 0 then raise exception 'Cantidad inválida'; end if;
  select * into _item from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  _diff := p_new_qty - _item.stock;
  if _diff = 0 then return null; end if;
  insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date)
    values(_tenant, p_item_id, 'ajuste', abs(_diff), _item.avg_cost, coalesce(nullif(p_reason,''),'Ajuste manual'), auth.uid(), current_date)
    returning id into _mv_id;
  update public.inventory_items set stock = p_new_qty, updated_at = now() where id = p_item_id and tenant_id = _tenant;
  if _item.landing_product_id is not null then
    update public.tenant_landing_products set stock_quantity = p_new_qty, updated_at = now() where id = _item.landing_product_id and tenant_id = _tenant;
  end if;
  return _mv_id;
end $$;

-- RPC record_shrinkage: registra 'merma' (qty positiva) + resta stock + sync landing.
create or replace function public.record_shrinkage(p_item_id uuid, p_qty numeric, p_reason text default null)
 returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _tenant uuid := current_tenant(); _item public.inventory_items%rowtype; _mv_id uuid;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'Cantidad inválida'; end if;
  select * into _item from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date)
    values(_tenant, p_item_id, 'merma', p_qty, _item.avg_cost, coalesce(nullif(p_reason,''),'Merma'), auth.uid(), current_date)
    returning id into _mv_id;
  update public.inventory_items set stock = stock - p_qty, updated_at = now() where id = p_item_id and tenant_id = _tenant;
  if _item.landing_product_id is not null then
    update public.tenant_landing_products set stock_quantity = _item.stock - p_qty, updated_at = now() where id = _item.landing_product_id and tenant_id = _tenant;
  end if;
  return _mv_id;
end $$;
