-- 227 · Ola 2.1e-1 · AR real: due_date derivado + aging + estado de cuenta. NO toca el flujo de pago.
--
-- Con las facturas ya enlazadas al maestro (2.1d-ii) se calcula AR por customer_id (confiable), no por email.
-- Pago sigue TODO-O-NADA → balance = total (impaga) o 0 (pagada). overdue queda DERIVADO (nunca materializado).
-- invoices NO tiene invoice_date → la fecha de emisión es created_at::date. El AR de rutas (route_stops) NO se toca.

-- 1. Helper: días de un payment_terms (immutable, puro).
create or replace function public._payment_terms_days(_terms text, _custom_days int)
returns int language sql immutable as $$
  select case _terms
    when 'immediate' then 0 when 'net_15' then 15 when 'net_30' then 30
    when 'net_60' then 60 when 'net_90' then 90 when 'custom' then coalesce(_custom_days, 0) else 0 end;
$$;

-- 2. Backfill due_date de las facturas sin fecha: términos del cliente enlazado; sin cliente → immediate (vence al emitir).
update public.invoices i
set due_date = i.created_at::date + public._payment_terms_days(cp.payment_terms, cp.payment_terms_custom_days)
from public.customer_profiles cp
where i.customer_id = cp.id and i.due_date is null;
update public.invoices set due_date = created_at::date where due_date is null;

-- 3. Estado de cuenta de UN cliente (facturas + aging por bucket). Gate customers.view (staff; portal usa otra vía).
create or replace function public.get_customer_ar(_customer_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _tenant uuid := current_tenant(); _result jsonb;
begin
  if not public.can_access_module('customers','view') then raise exception 'NOT_AUTHORIZED'; end if;
  select jsonb_build_object(
    'customer_id', _customer_id,
    'total_outstanding', coalesce(sum(case when status not in ('paid','cancelled') then total else 0 end), 0),
    'invoices', coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'invoice_number', invoice_number, 'total', total, 'status', status,
      'invoice_date', created_at::date, 'due_date', due_date,
      'days_overdue', case when status in ('paid','cancelled') then 0 else greatest(0, current_date - due_date) end,
      'balance', case when status in ('paid','cancelled') then 0 else total end,
      'bucket', case
        when status in ('paid','cancelled') then 'paid'
        when due_date >= current_date then 'current'
        when current_date - due_date <= 30 then 'b1_30'
        when current_date - due_date <= 60 then 'b31_60'
        when current_date - due_date <= 90 then 'b61_90'
        else 'b90_plus' end
    ) order by due_date), '[]'::jsonb)
  ) into _result from public.invoices where customer_id = _customer_id and tenant_id = _tenant;
  return _result;
end $$;
grant execute on function public.get_customer_ar(uuid) to authenticated;

-- 4. Aging de toda la cartera del tenant: buckets + total + clientes con deuda (ordenados por monto).
create or replace function public.get_ar_aging()
returns jsonb language plpgsql security definer set search_path = public as $$
declare _tenant uuid := current_tenant(); _result jsonb;
begin
  if not public.can_access_module('billing','view') then raise exception 'NOT_AUTHORIZED'; end if;
  with open_invoices as (
    select i.customer_id, i.total,
      coalesce(cp.full_name, i.client_name, 'Sin cliente') as customer_name,
      case
        when i.due_date >= current_date then 'current'
        when current_date - i.due_date <= 30 then 'b1_30'
        when current_date - i.due_date <= 60 then 'b31_60'
        when current_date - i.due_date <= 90 then 'b61_90'
        else 'b90_plus' end as bucket
    from public.invoices i
    left join public.customer_profiles cp on cp.id = i.customer_id
    where i.tenant_id = _tenant and i.status not in ('paid','cancelled')
  ), per_customer as (
    select customer_id, max(customer_name) as customer_name, sum(total) as outstanding
    from open_invoices group by customer_id
  )
  select jsonb_build_object(
    'buckets', (select jsonb_build_object(
      'current', coalesce(sum(total) filter (where bucket='current'),0),
      'b1_30', coalesce(sum(total) filter (where bucket='b1_30'),0),
      'b31_60', coalesce(sum(total) filter (where bucket='b31_60'),0),
      'b61_90', coalesce(sum(total) filter (where bucket='b61_90'),0),
      'b90_plus', coalesce(sum(total) filter (where bucket='b90_plus'),0)) from open_invoices),
    'total_outstanding', (select coalesce(sum(total),0) from open_invoices),
    'by_customer', coalesce((select jsonb_agg(jsonb_build_object(
      'customer_id', customer_id, 'customer_name', customer_name, 'outstanding', outstanding)
      order by outstanding desc) from per_customer), '[]'::jsonb)
  ) into _result;
  return _result;
end $$;
grant execute on function public.get_ar_aging() to authenticated;

-- 5. convert_quote_to_invoice: setea due_date derivado de los términos del cliente del quote (def viva + due_date).
create or replace function public.convert_quote_to_invoice(p_quote_id uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _q public.quotes%rowtype; _inv uuid; _terms text; _cdays int; _due date;
begin
  if not public.can_access_module('quotes','edit') then raise exception 'No autorizado'; end if;
  select * into _q from quotes where id = p_quote_id and tenant_id = _tenant;
  if not found then raise exception 'Cotización no encontrada'; end if;
  if _q.linked_invoice_id is not null then raise exception 'Cotización ya convertida'; end if;
  if _q.status <> 'accepted' then raise exception 'La cotización debe estar aceptada'; end if;
  if _q.customer_id is not null then
    select payment_terms, payment_terms_custom_days into _terms, _cdays from customer_profiles where id = _q.customer_id;
  end if;
  _due := current_date + public._payment_terms_days(coalesce(_terms, 'immediate'), _cdays);
  insert into invoices(tenant_id, client_name, phone, email, customer_id, due_date, items, subtotal, tax, total, status, linked_lead_id, linked_quote_id, created_by)
    values(_tenant, _q.client_name, _q.client_phone, _q.client_email, _q.customer_id, _due, _q.items, _q.subtotal, _q.tax_total, _q.total, 'draft', _q.linked_lead_id, p_quote_id, auth.uid())
    returning id into _inv;
  update quotes set status='converted', linked_invoice_id=_inv, responded_at=coalesce(responded_at, now()) where id=p_quote_id;
  return _inv;
end $function$;
