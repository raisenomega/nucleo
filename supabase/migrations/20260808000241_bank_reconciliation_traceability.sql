-- =============================================
-- Ola 2.5d+e · Trazabilidad depósito↔income + integrar la conciliación al cierre de mes
-- Cierra Ola 2.5. No toca el matching de 2.5b. close_month puebla bank_balance/reconciliation_diff.
-- =============================================

-- A1: enriquecer list_line_matches (2.5b) con fecha+descripción de la entrada (join income/expenses).
create or replace function public.list_line_matches(_line_id uuid)
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'entry_type', m.entry_type, 'entry_id', m.entry_id, 'amount', m.amount,
    'date', coalesce(i.income_date, e.expense_date),
    'description', coalesce(i.notes, e.notes)) order by coalesce(i.income_date, e.expense_date)), '[]'::jsonb)
  from public.bank_line_matches m
    left join public.income i on m.entry_type='income' and i.id=m.entry_id
    left join public.expenses e on m.entry_type='expense' and e.id=m.entry_id
  where m.line_id=_line_id and m.tenant_id=public.current_tenant();
$function$;

-- A2: desde un income/expense, la línea bancaria a la que está conciliado (o NULL si pendiente).
create or replace function public.get_entry_reconciliation(_entry_type text, _entry_id uuid)
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  select jsonb_build_object('line_id', l.id, 'txn_date', l.txn_date, 'description', l.description,
    'amount', l.amount, 'bank_name', ba.bank_name)
  from public.bank_line_matches m
    join public.bank_statement_lines l on l.id=m.line_id
    join public.bank_accounts ba on ba.id=l.bank_account_id
  where m.entry_type=_entry_type and m.entry_id=_entry_id and m.tenant_id=public.current_tenant()
  limit 1;
$function$;

-- B2: estado de conciliación de un mes (para la advertencia del dialog de cierre).
create or replace function public.get_month_reconciliation_status(_year int, _month int)
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  with t as (select case when public.can_access_module('reconciliation','view') then public.current_tenant() else null end tid,
             make_date(_year,_month,1) m0, (make_date(_year,_month,1)+interval '1 month')::date m1),
  l as (select bsl.match_status, bsl.amount from public.bank_statement_lines bsl, t
        where bsl.tenant_id=t.tid and bsl.txn_date>=t.m0 and bsl.txn_date<t.m1)
  select jsonb_build_object(
    'total_lines', count(*),
    'matched', count(*) filter (where match_status='matched'),
    'unmatched', count(*) filter (where match_status='unmatched'),
    'unmatched_amount', coalesce(sum(abs(amount)) filter (where match_status='unmatched'), 0))
  from l;
$function$;

-- B3: estado por (año,mes) de todos los meses con líneas (para los badges del panel de cierre, 1 sola llamada).
create or replace function public.list_reconciliation_status()
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'period_year', y, 'period_month', mo, 'total_lines', tl, 'matched', mt, 'unmatched', um, 'unmatched_amount', ua)
    order by y desc, mo desc), '[]'::jsonb)
  from (
    select extract(year from txn_date)::int y, extract(month from txn_date)::int mo,
      count(*) tl, count(*) filter (where match_status='matched') mt,
      count(*) filter (where match_status='unmatched') um,
      coalesce(sum(abs(amount)) filter (where match_status='unmatched'),0) ua
    from public.bank_statement_lines
    where tenant_id = (case when public.can_access_module('reconciliation','view') then public.current_tenant() else null end)
    group by 1,2) s;
$function$;

-- B1: close_month puebla bank_balance (Σ real_balance del mes, NULL si no hay) + reconciliation_diff
--     (reutiliza get_reconciliation_snapshot, no duplica el cálculo). Resto IDÉNTICO a la def viva.
create or replace function public.close_month(p_year integer, p_month integer)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := public.current_tenant(); _tot jsonb; _id uuid; _m1 date; _bank numeric; _diff numeric;
begin
  if not public.is_ceo_or_above() then raise exception 'NOT_AUTHORIZED'; end if;
  _m1 := (make_date(p_year, p_month, 1) + interval '1 month')::date;
  if _m1 > date_trunc('month', current_date)::date then raise exception 'PERIOD_NOT_ENDED'; end if;
  if exists (select 1 from public.month_closures where tenant_id=_t and period_year=p_year and period_month=p_month)
    then raise exception 'ALREADY_CLOSED'; end if;

  _tot := public._month_totals(_t, p_year, p_month);
  select sum(real_balance) into _bank from public.bank_balance_records
    where tenant_id=_t and period_year=p_year and period_month=p_month;   -- NULL si no hay registros
  _diff := (public.get_reconciliation_snapshot(make_date(p_year, p_month, 1))->'bank_panel'->>'difference')::numeric;

  insert into public.month_closures (
    tenant_id, period_month, period_year, total_income, total_expenses, total_payroll, total_extraordinary,
    retention_required, retention_deposited, net_balance, bank_balance, reconciliation_diff, closed_by)
  values (_t, p_month, p_year,
    (_tot->>'total_income')::numeric, (_tot->>'total_expenses')::numeric, (_tot->>'total_payroll')::numeric,
    (_tot->>'total_extraordinary')::numeric, (_tot->>'retention_required')::numeric, (_tot->>'retention_deposited')::numeric,
    (_tot->>'total_income')::numeric - (_tot->>'total_expenses')::numeric - (_tot->>'total_payroll')::numeric - (_tot->>'total_extraordinary')::numeric,
    _bank, _diff, auth.uid())
  returning id into _id;
  return jsonb_build_object('status','ok','closure_id',_id) || _tot;
end $function$;
