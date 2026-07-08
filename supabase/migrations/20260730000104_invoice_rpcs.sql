-- 20260730000104_invoice_rpcs.sql
-- MÓDULO FACTURACIÓN (2/3): factura desde lead (copia lead_items) + confirmar pago -> ingreso.

create or replace function public.generate_invoice_from_lead(p_lead_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare _tenant uuid := current_tenant(); _lead public.leads%rowtype; _inv uuid; _items jsonb; _sub numeric; _tax numeric; _tot numeric;
begin
  if not public.can_access_module('billing','create') then raise exception 'No autorizado'; end if;
  select * into _lead from leads where id = p_lead_id and tenant_id = _tenant;
  if not found then raise exception 'Lead no encontrado'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('description',description,'quantity',quantity,'unit_price',unit_price,
           'tax_pct',tax_pct,'discount_pct',discount_pct,'line_total',line_total) order by sort),'[]'::jsonb),
         coalesce(sum(quantity*unit_price*(1-discount_pct/100)),0), coalesce(sum(line_total),0)
    into _items, _sub, _tot from lead_items where lead_id = p_lead_id and tenant_id = _tenant;
  if _tot = 0 and coalesce(_lead.quoted_price,0) > 0 then
    _items := jsonb_build_array(jsonb_build_object('description',_lead.service_requested,'quantity',1,'unit_price',_lead.quoted_price,'tax_pct',0,'discount_pct',0,'line_total',_lead.quoted_price));
    _sub := _lead.quoted_price; _tot := _lead.quoted_price;
  end if;
  _tax := _tot - _sub;
  insert into invoices(tenant_id, client_name, phone, email, items, subtotal, tax, total, status, linked_lead_id, created_by)
    values(_tenant, _lead.contact_name, _lead.phone, _lead.email, _items, _sub, _tax, _tot, 'draft', p_lead_id, auth.uid())
    returning id into _inv;
  return _inv;
end $$;
grant execute on function public.generate_invoice_from_lead(uuid) to authenticated;

create or replace function public.confirm_invoice_payment(p_invoice_id uuid, p_method_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare _tenant uuid := current_tenant(); _inv public.invoices%rowtype; _cat uuid; _pm uuid; _income uuid;
begin
  if not public.can_access_module('billing','edit') then raise exception 'No autorizado'; end if;
  select * into _inv from invoices where id = p_invoice_id and tenant_id = _tenant;
  if not found then raise exception 'Factura no encontrada'; end if;
  if _inv.linked_income_id is not null then raise exception 'Factura ya pagada'; end if;
  _pm := coalesce(p_method_id, _inv.payment_method_id);
  if _pm is null then
    select id into _pm from categories where tenant_id=_tenant and kind='payment_method' and label='Efectivo' limit 1;
    if _pm is null then insert into categories(tenant_id,kind,label,sort) values(_tenant,'payment_method','Efectivo',90) returning id into _pm; end if;
  end if;
  select id into _cat from categories where tenant_id=_tenant and kind='income' and label='Facturación' limit 1;
  if _cat is null then insert into categories(tenant_id,kind,label,sort) values(_tenant,'income','Facturación',85) returning id into _cat; end if;
  insert into income(tenant_id,category_id,payment_method_id,amount,income_date,client_reference,notes,created_by)
    values(_tenant,_cat,_pm,_inv.total,current_date,_inv.client_name,'Factura '||coalesce(_inv.invoice_number,''),auth.uid())
    returning id into _income;
  update invoices set status='paid', paid_at=now(), payment_method_id=_pm, linked_income_id=_income where id=p_invoice_id;
end $$;
grant execute on function public.confirm_invoice_payment(uuid, uuid) to authenticated;
