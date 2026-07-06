-- 20260705000037_reconciliation_snapshot.sql
-- RPC de Conciliación (§4, §6): los 4 paneles en un jsonb. Cruza income/expenses/payroll/
-- extraordinary/marketing + bank_accounts/bank_reconciliation + tax rules + retention + settings.
-- Tax panel delegado a tax_obligations_for (00036). SECURITY DEFINER + filtro por current_tenant().

create or replace function public.get_reconciliation_snapshot(p_month date default current_date)
returns jsonb language sql stable security definer set search_path = public as $$
  with t as (
    select public.current_tenant() as tid,
           date_trunc('month', p_month)::date as m0,
           (date_trunc('month', p_month) + interval '1 month')::date as m1,
           extract(month from p_month)::int as pm, extract(year from p_month)::int as py
  ),
  s as (
    select t.*,
      coalesce((select sum(amount) from public.income where tenant_id=t.tid and income_date>=t.m0 and income_date<t.m1 and deleted_at is null),0) as inc,
      coalesce((select sum(amount) from public.expenses where tenant_id=t.tid and expense_date>=t.m0 and expense_date<t.m1 and deleted_at is null),0) as exp,
      coalesce((select sum(amount) from public.payroll where tenant_id=t.tid and pay_date>=t.m0 and pay_date<t.m1 and deleted_at is null),0) as pay,
      coalesce((select sum(amount) from public.extraordinary_payments where tenant_id=t.tid and payment_date>=t.m0 and payment_date<t.m1 and deleted_at is null),0) as ext,
      coalesce((select sum(amount) from public.marketing_expenses where tenant_id=t.tid and expense_date>=t.m0 and expense_date<t.m1 and deleted_at is null),0) as mkt,
      public.tax_obligations_for(t.tid, t.m0, t.m1) as tax,
      coalesce((select (value#>>'{}')::numeric from public.settings where tenant_id=t.tid and key='retention_pct'),20) as rpct,
      coalesce((select sum(amount) from public.retention_deposits where tenant_id=t.tid and period_month=t.pm and period_year=t.py),0) as dep,
      (select jsonb_agg(jsonb_build_object('bankName',ba.bank_name,'balance',br.bank_balance,'cutoffDate',br.cutoff_date) order by ba.bank_name)
         from public.bank_accounts ba join public.bank_reconciliation br on br.bank_account_id=ba.id
         where ba.tenant_id=t.tid and br.period_month=t.pm and br.period_year=t.py and br.deleted_at is null) as accts,
      coalesce((select sum(br.bank_balance) from public.bank_reconciliation br where br.tenant_id=t.tid and br.period_month=t.pm and br.period_year=t.py and br.deleted_at is null),0) as bank_total
    from t
  ),
  c as (select *, round(inc*rpct/100,2) as req, (tax->>'total_estimated')::numeric as taxest,
           inc-exp-pay-ext-mkt as op from s)
  select jsonb_build_object(
    'bank_panel', jsonb_build_object('accounts', coalesce(accts,'[]'::jsonb), 'total_bank', bank_total,
       'total_system', inc-exp, 'difference', bank_total-(inc-exp)),
    'tax_panel', tax,
    'retention_panel', jsonb_build_object('retention_pct', rpct, 'required', req, 'deposited', dep, 'pending', req-dep),
    'summary_panel', jsonb_build_object('total_income', inc, 'total_expenses', exp, 'total_payroll', pay,
       'total_extraordinary', ext, 'total_marketing', mkt, 'operating_profit', op,
       'tax_estimated', taxest, 'retention_required', req, 'available_balance', op-taxest-req,
       'status', case when op-taxest-req > inc*0.20 and inc>0 then 'healthy'
         when op-taxest-req > 0 then 'tight' else 'at_risk' end)
  ) from c;
$$;
grant execute on function public.get_reconciliation_snapshot(date) to authenticated;
