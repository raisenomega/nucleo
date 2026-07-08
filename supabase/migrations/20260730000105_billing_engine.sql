-- 20260730000105_billing_engine.sql
-- MÓDULO FACTURACIÓN (3/3): ciclo recurrente + confirmar orden web -> ingreso(+lead) + KPIs.

create or replace function public.generate_recurring_invoices()
returns int language plpgsql security definer set search_path = public as $$
declare _tenant uuid := current_tenant(); _plan public.billing_plans%rowtype; _n int := 0; _step interval;
begin
  if not public.can_access_module('billing','create') then raise exception 'No autorizado'; end if;
  for _plan in select * from billing_plans where tenant_id=_tenant and status='active' and next_billing_date <= current_date loop
    insert into invoices(tenant_id, client_name, phone, email, items, subtotal, tax, total, status, due_date, created_by)
      values(_tenant, _plan.client_name, _plan.phone, _plan.email,
        jsonb_build_array(jsonb_build_object('description',coalesce(_plan.service_description,'Servicio recurrente'),
          'quantity',1,'unit_price',_plan.amount,'tax_pct',0,'discount_pct',0,'line_total',_plan.amount)),
        _plan.amount, 0, _plan.amount, 'sent', _plan.next_billing_date + 15, auth.uid());
    _step := case _plan.frequency when 'weekly' then interval '1 week' when 'biweekly' then interval '2 weeks'
               when 'monthly' then interval '1 month' when 'quarterly' then interval '3 months' else interval '1 year' end;
    update billing_plans set next_billing_date = next_billing_date + _step where id = _plan.id;
    _n := _n + 1;
  end loop;
  return _n;
end $$;
grant execute on function public.generate_recurring_invoices() to authenticated;

create or replace function public.confirm_online_order(p_order_id uuid, p_method_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare _tenant uuid := current_tenant(); _o public.online_orders%rowtype; _cat uuid; _pm uuid; _income uuid; _lead uuid; _name text; _phone text;
begin
  if not public.can_access_module('billing','edit') then raise exception 'No autorizado'; end if;
  select * into _o from online_orders where id = p_order_id and tenant_id = _tenant;
  if not found then raise exception 'Orden no encontrada'; end if;
  if _o.linked_income_id is not null then raise exception 'Orden ya confirmada'; end if;
  _name := coalesce(_o.contact->>'name','Cliente web'); _phone := coalesce(_o.contact->>'phone','');
  _pm := p_method_id;
  if _pm is null then select id into _pm from categories where tenant_id=_tenant and kind='payment_method' and label='Efectivo' limit 1;
    if _pm is null then insert into categories(tenant_id,kind,label,sort) values(_tenant,'payment_method','Efectivo',90) returning id into _pm; end if; end if;
  select id into _cat from categories where tenant_id=_tenant and kind='income' and label='Venta web' limit 1;
  if _cat is null then insert into categories(tenant_id,kind,label,sort) values(_tenant,'income','Venta web',86) returning id into _cat; end if;
  insert into income(tenant_id,category_id,payment_method_id,amount,income_date,client_reference,order_number,notes,created_by)
    values(_tenant,_cat,_pm,_o.total,current_date,_name,_o.order_number,'Orden web '||coalesce(_o.order_number,''),auth.uid()) returning id into _income;
  _lead := _o.linked_lead_id;
  if _lead is null and _phone <> '' then
    select id into _lead from leads where tenant_id=_tenant and phone=_phone limit 1;
    if _lead is null then
      insert into leads(tenant_id,contact_name,phone,email,service_requested,lead_source,temperature,status,attended_by)
        values(_tenant,_name,_phone,_o.contact->>'email',coalesce(_o.main_line->>'label','Servicio web'),'Web','warm','Convertido',auth.uid()) returning id into _lead;
    end if;
  end if;
  update online_orders set status='Pagada', linked_income_id=_income, linked_lead_id=_lead where id=p_order_id;
end $$;
grant execute on function public.confirm_online_order(uuid, uuid) to authenticated;

create or replace function public.get_billing_summary()
returns jsonb language sql stable security definer set search_path = public as $$
  with g as (select case when public.can_access_module('billing','view') then public.current_tenant() else null end as tid)
  select jsonb_build_object(
    'invoices_pending', (select count(*) from invoices where tenant_id=(select tid from g) and status in ('draft','sent')),
    'invoices_overdue', (select count(*) from invoices where tenant_id=(select tid from g) and status not in ('paid','cancelled') and due_date is not null and due_date < current_date),
    'orders_pending', (select count(*) from online_orders where tenant_id=(select tid from g) and status in ('Nueva','Contactada')),
    'mrr', (select coalesce(sum(case frequency when 'weekly' then amount*52/12 when 'biweekly' then amount*26/12 when 'monthly' then amount when 'quarterly' then amount/3 when 'annual' then amount/12 else 0 end),0)
              from billing_plans where tenant_id=(select tid from g) and status='active')
  );
$$;
grant execute on function public.get_billing_summary() to authenticated;
