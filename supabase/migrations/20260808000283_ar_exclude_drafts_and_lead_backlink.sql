-- Cliente 360 · Rodaja 11 — fixes del E2E:
-- Bug #1: get_customer_ar y get_ar_aging contaban facturas 'draft' como cuentas por cobrar. Un borrador no es AR
--         (la deuda nace al EMITIR). Se excluye 'draft' del cálculo (paid/cancelled ya se excluían del balance).
-- Bug #2: generate_quote_from_lead creaba/resolvía el cliente en la cotización pero dejaba lead.customer_id NULL.
--         Se back-linkea el lead al cliente resuelto (solo prospectivo, sin sobreescribir si ya estaba linkeado).

create or replace function public.get_customer_ar(_customer_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _tenant uuid := current_tenant(); _result jsonb; _inv_total numeric; _field jsonb; _field_total numeric;
begin
  if not public.can_access_module('customers','view') then raise exception 'NOT_AUTHORIZED'; end if;
  select jsonb_build_object(
    'customer_id', _customer_id,
    'total_outstanding', coalesce(sum(case when status not in ('paid','cancelled') then balance else 0 end), 0),
    'invoices', coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'invoice_number', invoice_number, 'total', total, 'status', status,
      'invoice_date', created_at::date, 'due_date', due_date, 'amount_paid', amount_paid,
      'days_overdue', case when status in ('paid','cancelled') then 0 else greatest(0, current_date - due_date) end,
      'balance', case when status in ('paid','cancelled') then 0 else balance end,
      'bucket', case
        when status in ('paid','cancelled') then 'paid'
        when due_date >= current_date then 'current'
        when current_date - due_date <= 30 then 'b1_30'
        when current_date - due_date <= 60 then 'b31_60'
        when current_date - due_date <= 90 then 'b61_90'
        else 'b90_plus' end
    ) order by due_date), '[]'::jsonb)
  ) into _result from public.invoices where customer_id = _customer_id and tenant_id = _tenant and status <> 'draft';
  _inv_total := coalesce((_result->>'total_outstanding')::numeric, 0);

  -- Deuda de campo: paradas con pending_collection enlazadas a este cliente (mismo tenant, no borradas).
  select coalesce(sum(s.estimated_amount), 0),
    coalesce(jsonb_agg(jsonb_build_object(
      'stop_id', s.id, 'route_date', r.route_date, 'service_type', s.service_type,
      'amount', s.estimated_amount, 'address', s.address, 'assigned_to', coalesce(p.full_name, '—')
    ) order by r.route_date desc), '[]'::jsonb)
  into _field_total, _field
  from public.route_stops s
    join public.service_routes r on r.id = s.route_id
    left join public.profiles p on p.id = r.assigned_to
  where s.pending_collection = true and s.deleted_at is null
    and s.customer_id = _customer_id and s.tenant_id = _tenant;

  return _result || jsonb_build_object(
    'field_debt', jsonb_build_object('total', _field_total, 'stops', _field),
    'total_due', _inv_total + _field_total);
end $$;

create or replace function public.get_ar_aging()
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _tenant uuid := current_tenant(); _result jsonb; _field_total numeric;
begin
  if not public.can_access_module('billing','view') then raise exception 'NOT_AUTHORIZED'; end if;
  with open_invoices as (
    select i.customer_id, i.balance as amt,
      coalesce(cp.full_name, i.client_name, 'Sin cliente') as customer_name,
      case
        when i.due_date >= current_date then 'current'
        when current_date - i.due_date <= 30 then 'b1_30'
        when current_date - i.due_date <= 60 then 'b31_60'
        when current_date - i.due_date <= 90 then 'b61_90'
        else 'b90_plus' end as bucket
    from public.invoices i
    left join public.customer_profiles cp on cp.id = i.customer_id
    where i.tenant_id = _tenant and i.status not in ('paid','cancelled','draft')
  ), per_customer as (
    select customer_id, max(customer_name) as customer_name, sum(amt) as outstanding
    from open_invoices group by customer_id
  )
  select jsonb_build_object(
    'buckets', (select jsonb_build_object(
      'current', coalesce(sum(amt) filter (where bucket='current'),0),
      'b1_30', coalesce(sum(amt) filter (where bucket='b1_30'),0),
      'b31_60', coalesce(sum(amt) filter (where bucket='b31_60'),0),
      'b61_90', coalesce(sum(amt) filter (where bucket='b61_90'),0),
      'b90_plus', coalesce(sum(amt) filter (where bucket='b90_plus'),0)) from open_invoices),
    'total_outstanding', (select coalesce(sum(amt),0) from open_invoices),
    'by_customer', coalesce((select jsonb_agg(jsonb_build_object(
      'customer_id', customer_id, 'customer_name', customer_name, 'outstanding', outstanding)
      order by outstanding desc) from per_customer), '[]'::jsonb)
  ) into _result;

  select coalesce(sum(estimated_amount), 0) into _field_total
  from public.route_stops
  where tenant_id = _tenant and pending_collection = true and deleted_at is null;

  return _result || jsonb_build_object(
    'field_debt_total', _field_total,
    'total_due', coalesce((_result->>'total_outstanding')::numeric, 0) + _field_total);
end $$;

create or replace function public.generate_quote_from_lead(p_lead_id uuid)
 returns uuid language plpgsql security definer set search_path to 'public' as $$
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
  _cid := public._resolve_customer_by_email(_tenant, _lead.email, _lead.contact_name, _lead.phone, 'lead');  -- lead sin email → NULL, OK
  insert into quotes(tenant_id, client_name, client_phone, client_email, client_address, customer_id, items, subtotal, tax_total, total, status, valid_until, linked_lead_id, created_by)
    values(_tenant, _lead.contact_name, _lead.phone, _lead.email, _lead.address, _cid, _items, _sub, _tax, _tot, 'draft', current_date + 15, p_lead_id, auth.uid())
    returning id into _q;
  -- Bug #2 fix: back-link del lead al cliente resuelto (prospectivo; no sobreescribe si ya estaba linkeado).
  if _cid is not null then
    update leads set customer_id = _cid where id = p_lead_id and tenant_id = _tenant and customer_id is null;
  end if;
  return _q;
end $$;
