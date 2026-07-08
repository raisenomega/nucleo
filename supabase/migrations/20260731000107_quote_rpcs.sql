-- 20260731000107_quote_rpcs.sql
-- MÓDULO COTIZACIONES (2/2): cotización desde lead + convertir a factura + KPIs.

create or replace function public.generate_quote_from_lead(p_lead_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare _tenant uuid := current_tenant(); _lead public.leads%rowtype; _q uuid; _items jsonb; _sub numeric; _tax numeric; _tot numeric;
begin
  if not public.can_access_module('quotes','create') then raise exception 'No autorizado'; end if;
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
  insert into quotes(tenant_id, client_name, client_phone, client_email, client_address, items, subtotal, tax_total, total, status, valid_until, linked_lead_id, created_by)
    values(_tenant, _lead.contact_name, _lead.phone, _lead.email, _lead.address, _items, _sub, _tax, _tot, 'draft', current_date + 15, p_lead_id, auth.uid())
    returning id into _q;
  return _q;
end $$;
grant execute on function public.generate_quote_from_lead(uuid) to authenticated;

create or replace function public.convert_quote_to_invoice(p_quote_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare _tenant uuid := current_tenant(); _q public.quotes%rowtype; _inv uuid;
begin
  if not public.can_access_module('quotes','edit') then raise exception 'No autorizado'; end if;
  select * into _q from quotes where id = p_quote_id and tenant_id = _tenant;
  if not found then raise exception 'Cotización no encontrada'; end if;
  if _q.linked_invoice_id is not null then raise exception 'Cotización ya convertida'; end if;
  if _q.status <> 'accepted' then raise exception 'La cotización debe estar aceptada'; end if;
  insert into invoices(tenant_id, client_name, phone, email, items, subtotal, tax, total, status, linked_lead_id, linked_quote_id, created_by)
    values(_tenant, _q.client_name, _q.client_phone, _q.client_email, _q.items, _q.subtotal, _q.tax_total, _q.total, 'sent', _q.linked_lead_id, p_quote_id, auth.uid())
    returning id into _inv;
  update quotes set status='converted', linked_invoice_id=_inv, responded_at=coalesce(responded_at, now()) where id=p_quote_id;
  return _inv;
end $$;
grant execute on function public.convert_quote_to_invoice(uuid) to authenticated;

create or replace function public.get_quotes_summary()
returns jsonb language sql stable security definer set search_path = public as $$
  with g as (select case when public.can_access_module('quotes','view') then public.current_tenant() else null end as tid)
  select jsonb_build_object(
    'draft',    (select count(*) from quotes where tenant_id=(select tid from g) and status='draft'),
    'sent',     (select count(*) from quotes where tenant_id=(select tid from g) and status in ('sent','viewed')),
    'accepted', (select count(*) from quotes where tenant_id=(select tid from g) and status in ('accepted','converted')),
    'rejected', (select count(*) from quotes where tenant_id=(select tid from g) and status='rejected'),
    'expired',  (select count(*) from quotes where tenant_id=(select tid from g) and status='expired'),
    'total_quoted', (select coalesce(sum(total),0) from quotes where tenant_id=(select tid from g) and status not in ('rejected','expired'))
  );
$$;
grant execute on function public.get_quotes_summary() to authenticated;
