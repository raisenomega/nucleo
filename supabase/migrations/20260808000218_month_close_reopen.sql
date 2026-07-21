-- 218 · Ola 1.2a · Cierre de mes: close_month + reopen_month + preview (SIN bloqueo de edición).
--
-- month_closures existe desde la migr 005 como cascarón (0 filas, solo policy SELECT, nada la escribe).
-- Esta migración la ACTIVA: congela el snapshot financiero de un mes terminado. Agregación IDÉNTICA a
-- get_financial_snapshot (migr 079): sum(amount) con income_date/expense_date en [m0,m1) y deleted_at is null;
-- payroll por pay_date (net_salary) y extraordinary por payment_date, mismo patrón.
--
-- ALCANCE 1.2a: cerrar solo CONGELA los totales. AÚN NO impide editar/borrar transacciones del mes cerrado —
-- ese trigger de bloqueo va en 1.2b (toca el camino crítico y merece su propia verificación). La UI lo dice
-- explícito para no dar falsa sensación de seguridad.

-- Totales de un mes (compartido por preview y close → el dialog muestra EXACTO lo que se congela).
create or replace function public._month_totals(p_tenant uuid, p_year int, p_month int)
returns jsonb language sql stable security definer set search_path = public as $$
  with w as (select make_date(p_year, p_month, 1) as m0, (make_date(p_year, p_month, 1) + interval '1 month')::date as m1)
  select jsonb_build_object(
    'total_income',        (select coalesce(sum(amount),0) from public.income i, w where i.tenant_id=p_tenant and i.income_date >= w.m0 and i.income_date < w.m1 and i.deleted_at is null),
    'total_expenses',      (select coalesce(sum(amount),0) from public.expenses e, w where e.tenant_id=p_tenant and e.expense_date >= w.m0 and e.expense_date < w.m1 and e.deleted_at is null),
    'total_payroll',       (select coalesce(sum(net_salary),0) from public.payroll p, w where p.tenant_id=p_tenant and p.pay_date >= w.m0 and p.pay_date < w.m1 and p.deleted_at is null),
    'total_extraordinary', (select coalesce(sum(amount),0) from public.extraordinary_payments x, w where x.tenant_id=p_tenant and x.payment_date >= w.m0 and x.payment_date < w.m1 and x.deleted_at is null),
    'retention_required',  (select coalesce(sum(retention_amount),0) from public.income i, w where i.tenant_id=p_tenant and i.income_date >= w.m0 and i.income_date < w.m1 and i.deleted_at is null),
    'retention_deposited', (select coalesce(sum(amount),0) from public.retention_deposits r where r.tenant_id=p_tenant and r.period_year=p_year and r.period_month=p_month)
  );
$$;

-- Preview (read-only) para el dialog de confirmación. Gate CEO+.
create or replace function public.preview_month_close(p_year int, p_month int)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_ceo_or_above() then raise exception 'NOT_AUTHORIZED'; end if;
  return public._month_totals(public.current_tenant(), p_year, p_month);
end $$;

-- Cierra un mes TERMINADO: congela los totales en month_closures.
create or replace function public.close_month(p_year int, p_month int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _t uuid := public.current_tenant(); _tot jsonb; _id uuid; _m1 date;
begin
  if not public.is_ceo_or_above() then raise exception 'NOT_AUTHORIZED'; end if;
  _m1 := (make_date(p_year, p_month, 1) + interval '1 month')::date;
  if _m1 > date_trunc('month', current_date)::date then raise exception 'PERIOD_NOT_ENDED'; end if;
  if exists (select 1 from public.month_closures where tenant_id=_t and period_year=p_year and period_month=p_month)
    then raise exception 'ALREADY_CLOSED'; end if;

  _tot := public._month_totals(_t, p_year, p_month);
  insert into public.month_closures (
    tenant_id, period_month, period_year, total_income, total_expenses, total_payroll, total_extraordinary,
    retention_required, retention_deposited, net_balance, bank_balance, reconciliation_diff, closed_by)
  values (_t, p_month, p_year,
    (_tot->>'total_income')::numeric, (_tot->>'total_expenses')::numeric, (_tot->>'total_payroll')::numeric,
    (_tot->>'total_extraordinary')::numeric, (_tot->>'retention_required')::numeric, (_tot->>'retention_deposited')::numeric,
    (_tot->>'total_income')::numeric - (_tot->>'total_expenses')::numeric - (_tot->>'total_payroll')::numeric - (_tot->>'total_extraordinary')::numeric,
    null, null, auth.uid())  -- bank_balance/reconciliation_diff: se integran en una fase posterior (hoy la conciliación los calcula al vuelo)
  returning id into _id;
  return jsonb_build_object('status','ok','closure_id',_id) || _tot;
end $$;

-- Reabre un mes: borra la fila (los totales quedarían obsoletos si se edita algo) y audita el motivo.
create or replace function public.reopen_month(p_year int, p_month int, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _t uuid := public.current_tenant(); _n int;
begin
  if not public.is_ceo_or_above() then raise exception 'NOT_AUTHORIZED'; end if;
  if p_reason is null or length(trim(p_reason)) < 5 then raise exception 'REASON_REQUIRED'; end if;
  delete from public.month_closures where tenant_id=_t and period_year=p_year and period_month=p_month;
  get diagnostics _n = row_count;
  if _n = 0 then raise exception 'NOT_CLOSED'; end if;
  insert into public.tenant_audit_log (tenant_id, entity_type, action, actor, changes)
    values (_t, 'month_closure', 'reopen_month', auth.uid(),
            jsonb_build_object('year',p_year,'month',p_month,'reason',trim(p_reason)));
  return jsonb_build_object('status','ok');
end $$;

revoke execute on function public.preview_month_close(int,int), public.close_month(int,int), public.reopen_month(int,int,text) from public, anon;
grant execute on function public.preview_month_close(int,int), public.close_month(int,int), public.reopen_month(int,int,text) to authenticated;
