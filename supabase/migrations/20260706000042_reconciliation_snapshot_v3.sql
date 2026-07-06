-- 20260706000042_reconciliation_snapshot_v3.sql
-- Conciliación v3 (Opción C híbrida): bank_panel.accounts ahora trae deposits + calculatedBalance
-- + difference POR CUENTA (opening + depósitos de esa cuenta). Los totales del panel no cambian.

create or replace function public.get_reconciliation_snapshot(p_month date default current_date)
returns jsonb language sql stable security definer set search_path = public as $$
  with t as (
    select public.current_tenant() as tid,
           date_trunc('month', p_month)::date as m0,
           (date_trunc('month', p_month) + interval '1 month')::date as m1,
           extract(month from p_month)::int as pm, extract(year from p_month)::int as py,
           coalesce((select (value#>>'{}')::numeric from public.settings where tenant_id=public.current_tenant() and key='retention_pct'),20) as rpct
  ),
  s as (
    select t.*,
      coalesce((select sum(amount) from public.income where tenant_id=t.tid and income_date>=t.m0 and income_date<t.m1 and deleted_at is null),0) as inc,
      coalesce((select sum(amount) from public.expenses where tenant_id=t.tid and expense_date>=t.m0 and expense_date<t.m1 and deleted_at is null),0) as exp,
      coalesce((select sum(amount) from public.payroll where tenant_id=t.tid and pay_date>=t.m0 and pay_date<t.m1 and deleted_at is null),0) as pay,
      coalesce((select sum(amount) from public.extraordinary_payments where tenant_id=t.tid and payment_date>=t.m0 and payment_date<t.m1 and deleted_at is null),0) as ext,
      coalesce((select sum(amount) from public.marketing_expenses where tenant_id=t.tid and expense_date>=t.m0 and expense_date<t.m1 and deleted_at is null),0) as mkt,
      coalesce((select sum(amount) from public.bank_deposits where tenant_id=t.tid and deposit_date>=t.m0 and deposit_date<t.m1),0) as dep,
      coalesce((select sum(opening_balance) from public.bank_balance_records where tenant_id=t.tid and period_year=t.py and period_month=t.pm),0) as opening,
      coalesce((select sum(real_balance) from public.bank_balance_records where tenant_id=t.tid and period_year=t.py and period_month=t.pm),0) as real_bal,
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
      public.monthly_series_for(t.tid,t.py,t.rpct) as series
    from t
  ),
  c as (select *, exp+pay+ext+mkt as out, (tax->>'total_estimated')::numeric as taxest, round(inc*rpct/100,2) as req from s)
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
       'expense_breakdown', ebd,
       'health', jsonb_build_object('total_out', out, 'break_even', out,
         'break_even_pct', case when out>0 then least(100, round(inc/out*100,1)) else 0 end,
         'shortfall', greatest(0, out-inc), 'surplus', greatest(0, inc-out),
         'operating_margin', case when inc>0 then round((inc-out)/inc*100,1) else 0 end,
         'operating_status', case when inc-out > inc*0.20 and inc>0 then 'surplus' when inc-out >= 0 then 'tight' else 'deficit' end,
         'trend', series))
  ) from c;
$$;
grant execute on function public.get_reconciliation_snapshot(date) to authenticated;
