-- 228 · Ola 2.1e-2 · Pagos parciales de facturas.
--
-- El pago pasa de TODO-O-NADA a N pagos por factura. Cada pago crea UN income por su monto (preserva el invariante
-- contable "pago = income" y respeta el period lock de Ola 1.2). amount_paid/balance materializados en invoices,
-- actualizados SOLO por las RPCs (un único camino). Nuevo estado partially_paid. El aging pasa a usar balance real.
-- income.payment_method_id es FK a categories (kind='payment_method') → se resuelve como en confirm legacy.

-- 1. Columnas de balance + backfill (las 10 facturas vivas están en draft → balance = total)
alter table public.invoices
  add column if not exists amount_paid numeric(12,2) not null default 0,
  add column if not exists balance numeric(12,2);
update public.invoices set
  amount_paid = case when status = 'paid' then total else 0 end,
  balance = case when status = 'paid' then 0 else total end
where balance is null;

-- 2. partially_paid al CHECK
alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check
  check (status in ('draft','sent','partially_paid','paid','overdue','cancelled'));

-- 2b. balance es SIEMPRE derivado (writer único) → cubre facturas nuevas (form/convert no lo setean) y todo update.
create or replace function public._invoice_set_balance() returns trigger language plpgsql as $$
begin new.balance := round(new.total - coalesce(new.amount_paid, 0), 2); return new; end $$;
drop trigger if exists trg_invoice_balance on public.invoices;
create trigger trg_invoice_balance before insert or update on public.invoices
  for each row execute function public._invoice_set_balance();

-- 3. Tabla de pagos (N por factura). RLS SELECT por tenant (staff); escritura solo por RPCs DEFINER.
create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method_id uuid references public.categories(id),
  payment_date date not null default current_date,
  reference text, notes text,
  linked_income_id uuid references public.income(id),
  created_by uuid, created_at timestamptz not null default now());
create index if not exists idx_invoice_payments_invoice on public.invoice_payments (invoice_id);
alter table public.invoice_payments enable row level security;
drop policy if exists ipay_select on public.invoice_payments;
create policy ipay_select on public.invoice_payments for select using (tenant_id = public.current_tenant());

-- 4. Registrar un pago (parcial o total). Cada pago crea su income. Anti-sobrepago.
create or replace function public.record_invoice_payment(_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _tenant uuid := current_tenant(); _iid uuid := (_payload->>'invoice_id')::uuid; _amount numeric := (_payload->>'amount')::numeric;
  _inv public.invoices%rowtype; _pdate date := coalesce((_payload->>'payment_date')::date, current_date);
  _pm uuid; _cat uuid; _income uuid; _payment uuid; _new_paid numeric; _new_balance numeric; _new_status text;
begin
  if not public.can_access_module('billing','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  select * into _inv from public.invoices where id = _iid and tenant_id = _tenant;
  if not found then raise exception 'INVOICE_NOT_FOUND'; end if;
  if _inv.status in ('paid','cancelled') then raise exception 'INVOICE_NOT_PAYABLE'; end if;
  if _amount is null or _amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  _new_paid := _inv.amount_paid + _amount;
  if _new_paid > _inv.total + 0.01 then raise exception 'OVERPAYMENT'; end if;
  _new_balance := round(_inv.total - _new_paid, 2);
  _new_status := case when _new_balance <= 0.01 then 'paid' else 'partially_paid' end;
  -- método de pago (categoría, como el flujo legacy): dado → factura → 'Efectivo'
  _pm := coalesce((_payload->>'payment_method_id')::uuid, _inv.payment_method_id);
  if _pm is null then
    select id into _pm from categories where tenant_id=_tenant and kind='payment_method' and label='Efectivo' limit 1;
    if _pm is null then insert into categories(tenant_id,kind,label,sort) values(_tenant,'payment_method','Efectivo',90) returning id into _pm; end if;
  end if;
  select id into _cat from categories where tenant_id=_tenant and kind='income' and label='Facturación' limit 1;
  if _cat is null then insert into categories(tenant_id,kind,label,sort) values(_tenant,'income','Facturación',85) returning id into _cat; end if;
  insert into income(tenant_id, category_id, payment_method_id, amount, income_date, client_reference, notes, created_by)
    values(_tenant, _cat, _pm, _amount, _pdate, _inv.client_name, 'Pago factura '||coalesce(_inv.invoice_number,''), auth.uid())
    returning id into _income;
  insert into public.invoice_payments(tenant_id, invoice_id, amount, payment_method_id, payment_date, reference, notes, linked_income_id, created_by)
    values(_tenant, _iid, _amount, _pm, _pdate, _payload->>'reference', _payload->>'notes', _income, auth.uid())
    returning id into _payment;
  update public.invoices set amount_paid = _new_paid, status = _new_status,  -- balance lo deriva trg_invoice_balance
    payment_method_id = _pm, linked_income_id = _income,
    paid_at = case when _new_status = 'paid' then now() else paid_at end
  where id = _iid;
  return jsonb_build_object('status','ok','payment_id',_payment,'amount_paid',_new_paid,'balance',_new_balance,'invoice_status',_new_status);
end $$;
grant execute on function public.record_invoice_payment(jsonb) to authenticated;

-- 5. Revertir un pago. Soft-delete del income (el period lock de Ola 1.2 lo bloquea si está en mes cerrado).
create or replace function public.void_invoice_payment(_payment_id uuid, _reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _tenant uuid := current_tenant(); _pay public.invoice_payments%rowtype; _inv public.invoices%rowtype;
  _new_paid numeric; _new_balance numeric; _new_status text;
begin
  if not public.can_access_module('billing','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  if _reason is null or length(trim(_reason)) < 3 then raise exception 'REASON_REQUIRED'; end if;
  select * into _pay from public.invoice_payments where id = _payment_id and tenant_id = _tenant;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if _pay.linked_income_id is not null then  -- dispara aa_enforce_period_lock si el income está en mes cerrado
    update public.income set deleted_at = now(), deleted_reason = _reason, deleted_by = auth.uid() where id = _pay.linked_income_id;
  end if;
  select * into _inv from public.invoices where id = _pay.invoice_id;
  _new_paid := round(_inv.amount_paid - _pay.amount, 2);
  _new_balance := round(_inv.total - _new_paid, 2);
  _new_status := case when _new_paid <= 0.01 then 'sent' when _new_balance <= 0.01 then 'paid' else 'partially_paid' end;
  update public.invoices set amount_paid = _new_paid, status = _new_status,  -- balance lo deriva trg_invoice_balance
    paid_at = case when _new_status = 'paid' then paid_at else null end
  where id = _pay.invoice_id;
  delete from public.invoice_payments where id = _payment_id;
  return jsonb_build_object('status','ok','amount_paid',_new_paid,'balance',_new_balance,'invoice_status',_new_status);
end $$;
grant execute on function public.void_invoice_payment(uuid, text) to authenticated;

-- 6. confirm_invoice_payment legacy → atajo "pagar el total de una vez" (un solo camino: delega en record).
create or replace function public.confirm_invoice_payment(p_invoice_id uuid, p_method_id uuid default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare _bal numeric;
begin
  select balance into _bal from public.invoices where id = p_invoice_id and tenant_id = current_tenant();
  if _bal is null then raise exception 'Factura no encontrada'; end if;
  perform public.record_invoice_payment(jsonb_build_object('invoice_id', p_invoice_id, 'amount', _bal, 'payment_method_id', p_method_id));
end $$;

-- 7. Aging por BALANCE real (def viva + balance). get_customer_ar: outstanding y balance por factura usan invoices.balance.
create or replace function public.get_customer_ar(_customer_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _result jsonb;
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
  return _result;
end $function$;

create or replace function public.get_ar_aging()
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _result jsonb;
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
  return _result;
end $function$;
