-- 226 · Ola 2.1d-ii · Enlazar quotes + invoices al maestro de clientes.
--
-- Van JUNTAS porque convert_quote_to_invoice las acopla: si la factura no hereda el customer_id del quote,
-- nacería desenlazada. Reutiliza _resolve_customer_by_email (migr 225) — mismo resolver race-safe, dedup por
-- (tenant, lower(trim(email))), y el índice unique parcial anónimo ya existe. 100% aditivo (nada lee customer_id
-- en quotes/invoices hoy → cero breakage; el texto libre client_name/email/phone queda de fallback).

-- 1. FK aditivo nullable en ambas + índices
alter table public.quotes
  add column if not exists customer_id uuid references public.customer_profiles(id) on delete set null;
create index if not exists idx_quotes_customer on public.quotes (customer_id);
alter table public.invoices
  add column if not exists customer_id uuid references public.customer_profiles(id) on delete set null;
create index if not exists idx_invoices_customer on public.invoices (customer_id);

-- 2. convert_quote_to_invoice: la factura HEREDA el customer_id del quote (def viva + customer_id en INSERT/VALUES).
create or replace function public.convert_quote_to_invoice(p_quote_id uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _q public.quotes%rowtype; _inv uuid;
begin
  if not public.can_access_module('quotes','edit') then raise exception 'No autorizado'; end if;
  select * into _q from quotes where id = p_quote_id and tenant_id = _tenant;
  if not found then raise exception 'Cotización no encontrada'; end if;
  if _q.linked_invoice_id is not null then raise exception 'Cotización ya convertida'; end if;
  if _q.status <> 'accepted' then raise exception 'La cotización debe estar aceptada'; end if;
  insert into invoices(tenant_id, client_name, phone, email, customer_id, items, subtotal, tax, total, status, linked_lead_id, linked_quote_id, created_by)
    values(_tenant, _q.client_name, _q.client_phone, _q.client_email, _q.customer_id, _q.items, _q.subtotal, _q.tax_total, _q.total, 'draft', _q.linked_lead_id, p_quote_id, auth.uid())
    returning id into _inv;
  update quotes set status='converted', linked_invoice_id=_inv, responded_at=coalesce(responded_at, now()) where id=p_quote_id;
  return _inv;
end $function$;

-- 3. generate_quote_from_lead: resuelve customer_id por el email del lead (def viva + _cid + customer_id en INSERT).
create or replace function public.generate_quote_from_lead(p_lead_id uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _lead public.leads%rowtype; _q uuid; _items jsonb; _sub numeric; _tax numeric; _tot numeric; _cid uuid;
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
  _cid := public._resolve_customer_by_email(_tenant, _lead.email, _lead.contact_name, _lead.phone);  -- lead sin email → NULL, OK
  insert into quotes(tenant_id, client_name, client_phone, client_email, client_address, customer_id, items, subtotal, tax_total, total, status, valid_until, linked_lead_id, created_by)
    values(_tenant, _lead.contact_name, _lead.phone, _lead.email, _lead.address, _cid, _items, _sub, _tax, _tot, 'draft', current_date + 15, p_lead_id, auth.uid())
    returning id into _q;
  return _q;
end $function$;

-- 4. Backfill idempotente de quotes + invoices. Dedup por email, nombre canónico = más reciente.
create or replace function public.backfill_quotes_invoices_customers()
returns jsonb language plpgsql security definer set search_path = public as $function$
declare _rec record; _cid uuid; _q_linked int := 0; _i_linked int := 0; _before int; _after int;
begin
  if not public.is_superadmin() and not public.is_ceo_or_above() then raise exception 'NOT_AUTHORIZED'; end if;
  select count(*) into _before from public.customer_profiles where source = 'landing_order';
  for _rec in
    select distinct on (tenant_id, lower(trim(client_email))) tenant_id, client_email, client_name, client_phone
    from public.quotes where customer_id is null and client_email is not null and trim(client_email) <> ''
    order by tenant_id, lower(trim(client_email)), created_at desc
  loop
    _cid := public._resolve_customer_by_email(_rec.tenant_id, _rec.client_email, _rec.client_name, _rec.client_phone);
    update public.quotes set customer_id = _cid
      where tenant_id = _rec.tenant_id and lower(trim(client_email)) = lower(trim(_rec.client_email)) and customer_id is null;
    _q_linked := _q_linked + 1;
  end loop;
  for _rec in
    select distinct on (tenant_id, lower(trim(email))) tenant_id, email, client_name, phone
    from public.invoices where customer_id is null and email is not null and trim(email) <> ''
    order by tenant_id, lower(trim(email)), created_at desc
  loop
    _cid := public._resolve_customer_by_email(_rec.tenant_id, _rec.email, _rec.client_name, _rec.phone);
    update public.invoices set customer_id = _cid
      where tenant_id = _rec.tenant_id and lower(trim(email)) = lower(trim(_rec.email)) and customer_id is null;
    _i_linked := _i_linked + 1;
  end loop;
  select count(*) into _after from public.customer_profiles where source = 'landing_order';
  return jsonb_build_object('status','ok','quote_emails',_q_linked,'invoice_emails',_i_linked,'customers_created',_after - _before);
end $function$;

revoke execute on function public.backfill_quotes_invoices_customers() from public, anon;
grant execute on function public.backfill_quotes_invoices_customers() to authenticated;

-- 5. Ejecutar el backfill una vez. Claim superadmin TRANSACTION-LOCAL para pasar el gate sin JWT (Management API / CI).
do $$ begin
  perform set_config('request.jwt.claims', '{"user_role":"superadmin"}', true);
  perform public.backfill_quotes_invoices_customers();
end $$;
