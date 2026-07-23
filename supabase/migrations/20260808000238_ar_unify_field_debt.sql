-- Ola 2.4b · AR unificado por cliente: sumar la deuda de campo (paradas pendientes de cobro
-- enlazadas por customer_id en 2.4a) al estado de cuenta del cliente y a la cartera del tenant.
-- Se unifica la VISTA, no las tablas: facturas (invoices) y cobros de ruta (route_stops) coexisten.
-- get_accounts_receivable (pantalla operacional del chofer/supervisor) NO se toca.

-- 1) get_customer_ar: + field_debt {total, stops[]} + total_due (facturas impagas + deuda de campo).
create or replace function public.get_customer_ar(_customer_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
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
  ) into _result from public.invoices where customer_id = _customer_id and tenant_id = _tenant;
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
end $function$;

-- 2) get_ar_aging: + field_debt_total (todo el tenant, FUERA de los buckets — no tiene due_date) + total_due.
create or replace function public.get_ar_aging()
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
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
    where i.tenant_id = _tenant and i.status not in ('paid','cancelled')
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
end $function$;
