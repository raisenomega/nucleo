-- 20260722000079_snapshot_role_guards.sql
-- SEGURIDAD (P0-C · H3): los 4 snapshots eran SECURITY DEFINER + grant authenticated SIN chequeo de rol
-- -> un empleado sin permiso podia leer finanzas/CRM/marketing/conciliacion del tenant via RPC directo.
-- Fix: como son language sql (no pueden RAISE), se gatea en la CTE base: si el rol no autoriza el modulo,
-- tid = null y todos los joins quedan vacios (niega sin romper el contrato). Cuerpo IDENTICO salvo esa linea.


CREATE OR REPLACE FUNCTION public.get_financial_snapshot(p_month date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with t as (
    select case when public.can_access_module('income','view') or public.can_access_module('expenses','view') then public.current_tenant() else null end as tid,
           date_trunc('month', p_month)::date as m0,
           (date_trunc('month', p_month) + interval '1 month')::date as m1
  ),
  inc as (
    select i.amount, i.income_date as d, c.label
    from t
    join public.income i on i.tenant_id = t.tid
      and i.income_date >= t.m0 and i.income_date < t.m1 and i.deleted_at is null
    left join public.categories c on c.id = i.category_id
  ),
  exp as (
    select e.amount, e.expense_date as d, c.label
    from t
    join public.expenses e on e.tenant_id = t.tid
      and e.expense_date >= t.m0 and e.expense_date < t.m1 and e.deleted_at is null
    left join public.categories c on c.id = e.category_id
  )
  select jsonb_build_object(
    'total_income', coalesce((select sum(amount) from inc), 0),
    'total_expenses', coalesce((select sum(amount) from exp), 0),
    'balance', coalesce((select sum(amount) from inc), 0) - coalesce((select sum(amount) from exp), 0),
    'income_count', (select count(*) from inc),
    'expense_count', (select count(*) from exp),
    'top_income_category', (select label from inc group by label order by sum(amount) desc nulls last limit 1),
    'top_expense_category', (select label from exp group by label order by sum(amount) desc nulls last limit 1),
    'recent_income', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('date', d, 'category', label, 'amount', amount) x
        from inc order by d desc limit 5) s), '[]'::jsonb),
    'recent_expenses', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('date', d, 'category', label, 'amount', amount) x
        from exp order by d desc limit 5) s), '[]'::jsonb)
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_crm_snapshot(p_month date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with t as (
    select case when public.can_access_module('leads','view') then public.current_tenant() else null end as tid,
           date_trunc('month', p_month)::date as m0,
           (date_trunc('month', p_month) + interval '1 month')::date as m1
  ),
  l as (
    select ld.contact_name, ld.phone, ld.temperature, ld.status, ld.quoted_price, ld.call_date
    from t
    join public.leads ld on ld.tenant_id = t.tid
      and ld.call_date >= t.m0 and ld.call_date < t.m1 and ld.deleted_at is null
  )
  select jsonb_build_object(
    'total_leads', (select count(*) from l),
    'by_temperature', jsonb_build_object(
      'hot', (select count(*) from l where temperature = 'hot'),
      'warm', (select count(*) from l where temperature = 'warm'),
      'cold', (select count(*) from l where temperature = 'cold')),
    'by_status', jsonb_build_object(
      'new', (select count(*) from l where status = 'new'),
      'contacted', (select count(*) from l where status = 'contacted'),
      'quoted', (select count(*) from l where status = 'quoted'),
      'converted', (select count(*) from l where status = 'converted'),
      'lost', (select count(*) from l where status = 'lost')),
    'total_quoted', coalesce((select sum(quoted_price) from l), 0),
    'conversion_rate', case when (select count(*) from l) > 0
      then round((select count(*) from l where status = 'converted')::numeric * 100 / (select count(*) from l), 1)
      else 0 end,
    'recent_leads', coalesce((select jsonb_agg(x) from (
      select jsonb_build_object('contactName', contact_name, 'phone', phone, 'temperature', temperature,
        'status', status, 'quotedPrice', quoted_price, 'callDate', call_date) x
      from l order by call_date desc limit 5) s), '[]'::jsonb)
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_marketing_snapshot(p_month date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with t as (
    select case when public.can_access_module('marketing','view') then public.current_tenant() else null end as tid, date_trunc('month', p_month)::date as m0,
           (date_trunc('month', p_month) + interval '1 month')::date as m1
  ),
  b as (select coalesce(sum(budgeted_amount), 0) tot from public.marketing_budgets mb, t
    where mb.tenant_id = t.tid and mb.month >= t.m0 and mb.month < t.m1),
  e as (select coalesce(sum(amount), 0) tot from public.marketing_expenses me, t
    where me.tenant_id = t.tid and me.expense_date >= t.m0 and me.expense_date < t.m1 and me.deleted_at is null),
  ml as (
    select ld.status, ld.quoted_price
    from t
    join public.leads ld on ld.tenant_id = t.tid
      and ld.call_date >= t.m0 and ld.call_date < t.m1 and ld.deleted_at is null
    join public.categories c on c.id = ld.lead_source_id
    where public.channel_for_source(c.label) is not null
  )
  select jsonb_build_object(
    'total_budget', (select tot from b),
    'total_spent', (select tot from e),
    'executed_pct', case when (select tot from b) > 0
      then round((select tot from e) * 100 / (select tot from b), 1) else 0 end,
    'leads_generated', (select count(*) from ml),
    'converted', (select count(*) from ml where status = 'converted'),
    'cac', case when (select count(*) from ml where status = 'converted') > 0
      then round((select tot from e) / (select count(*) from ml where status = 'converted'), 2) else 0 end,
    'roi', case when (select tot from e) > 0
      then round((select coalesce(sum(quoted_price), 0) from ml where status = 'converted') * 100 / (select tot from e), 1) else 0 end
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_reconciliation_snapshot(p_month date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with t as (
    select case when public.can_access_module('reconciliation','view') then public.current_tenant() else null end as tid,
           date_trunc('month', p_month)::date as m0,
           (date_trunc('month', p_month) + interval '1 month')::date as m1,
           extract(month from p_month)::int as pm, extract(year from p_month)::int as py,
           coalesce((select (value#>>'{}')::numeric from public.settings where tenant_id=public.current_tenant() and key='retention_pct'),20) as rpct
  ),
  s as (
    select t.*,
      coalesce((select sum(amount) from public.income where tenant_id=t.tid and income_date>=t.m0 and income_date<t.m1 and deleted_at is null),0) as inc,
      coalesce((select sum(amount) from public.expenses where tenant_id=t.tid and expense_date>=t.m0 and expense_date<t.m1 and deleted_at is null),0) as exp,
      coalesce((select sum(coalesce(nullif(total_employer_cost,0),amount)) from public.payroll where tenant_id=t.tid and pay_date>=t.m0 and pay_date<t.m1 and deleted_at is null),0) as pay,
      coalesce((select sum(amount) from public.extraordinary_payments where tenant_id=t.tid and payment_date>=t.m0 and payment_date<t.m1 and deleted_at is null),0) as ext,
      coalesce((select sum(amount) from public.marketing_expenses where tenant_id=t.tid and expense_date>=t.m0 and expense_date<t.m1 and deleted_at is null),0) as mkt,
      coalesce((select sum(amount) from public.bank_deposits where tenant_id=t.tid and deposit_date>=t.m0 and deposit_date<t.m1),0) as dep,
      coalesce((select sum(opening_balance) from public.bank_balance_records where tenant_id=t.tid and period_year=t.py and period_month=t.pm),0) as opening,
      coalesce((select sum(real_balance) from public.bank_balance_records where tenant_id=t.tid and period_year=t.py and period_month=t.pm),0) as real_bal,
      coalesce((select sum(case frequency when 'quarterly' then budgeted_amount/3 when 'annual' then budgeted_amount/12 else budgeted_amount end) from public.recurring_expenses where tenant_id=t.tid and active),0) as budgeted,
      coalesce((select sum(e.amount) from public.expenses e where e.tenant_id=t.tid and e.expense_date>=t.m0 and e.expense_date<t.m1 and e.deleted_at is null and e.category_id in (select category_id from public.recurring_expenses re where re.tenant_id=t.tid and re.active)),0) as rpaid,
      (select jsonb_agg(jsonb_build_object('bankName',ba.bank_name,'openingBalance',r.opening_balance,
         'deposits',coalesce(d.dep,0),'calculatedBalance',r.opening_balance+coalesce(d.dep,0),
         'realBalance',r.real_balance,'difference',(r.opening_balance+coalesce(d.dep,0))-r.real_balance,
         'cutoffDate',r.cutoff_date) order by ba.bank_name)
       from public.bank_accounts ba
       join public.bank_balance_records r on r.bank_account_id=ba.id and r.tenant_id=t.tid and r.period_year=t.py and r.period_month=t.pm
       left join (select bank_account_id, sum(amount) dep from public.bank_deposits
                  where tenant_id=t.tid and deposit_date>=t.m0 and deposit_date<t.m1 group by bank_account_id) d on d.bank_account_id=ba.id
       where ba.tenant_id=t.tid) as accts,
      public.tax_obligations_for(t.tid,t.m0,t.m1) as tax,
      public.expense_breakdown_for(t.tid,t.m0,t.m1) as ebd,
      public.expense_classes_for(t.tid,t.m0,t.m1) as ec,
      public.monthly_series_for(t.tid,t.py,t.rpct) as series
    from t
  ),
  c as (select *, exp+pay+ext+mkt as out, (tax->>'total_estimated')::numeric as taxest, round(inc*rpct/100,2) as req, budgeted+pay as beven from s)
  select jsonb_build_object(
    'bank_panel', jsonb_build_object('accounts', coalesce(accts,'[]'::jsonb), 'opening_balance', opening,
       'deposits', dep, 'egresos', out, 'calculated_balance', opening+dep-out, 'real_balance', real_bal,
       'difference', real_bal-(opening+dep-out)),
    'tax_panel', tax,
    'retention_panel', jsonb_build_object('retention_pct', rpct, 'required', req, 'monthly', series),
    'summary_panel', jsonb_build_object('total_income', inc, 'total_expenses', exp, 'total_payroll', pay,
       'total_extraordinary', ext, 'total_marketing', mkt, 'operating_profit', inc-out, 'tax_estimated', taxest,
       'retention_required', req, 'available_balance', inc-out-taxest-req,
       'status', case when inc-out-taxest-req > inc*0.20 and inc>0 then 'healthy' when inc-out-taxest-req > 0 then 'tight' else 'at_risk' end,
       'expense_breakdown', ebd, 'expense_classes', ec,
       'health', jsonb_build_object('total_out', out, 'break_even', beven,
         'recurring_budgeted', budgeted, 'recurring_paid', rpaid,
         'fixed_expenses', (ec->>'fixed')::numeric, 'variable_expenses', (ec->>'variable')::numeric,
         'debt_expenses', (ec->>'debt')::numeric, 'one_time_expenses', (ec->>'one_time')::numeric,
         'break_even_pct', case when beven>0 then round(inc/beven*100,1) when inc>0 then 100 else 0 end,
         'shortfall', greatest(0, beven-inc), 'surplus', greatest(0, inc-beven),
         'operating_margin', case when inc>0 then round((inc-out)/inc*100,1) else 0 end,
         'operating_status', case when inc <= 0 then 'deficit' when inc >= beven*1.2 then 'surplus' when inc >= beven then 'tight' else 'deficit' end,
         'trend', series))
  ) from c;
$function$;


grant execute on function public.get_financial_snapshot(date) to authenticated;
grant execute on function public.get_crm_snapshot(date) to authenticated;
grant execute on function public.get_marketing_snapshot(date) to authenticated;
grant execute on function public.get_reconciliation_snapshot(date) to authenticated;
