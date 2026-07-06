-- 20260705000036_reconciliation_tax_helper.sql
-- Helper del RPC de conciliación (§4): calcula el tax_panel de un tenant para un rango de mes.
-- Se separa por el límite de 75 líneas del oráculo; lo consume get_reconciliation_snapshot (00037).
-- NOTA v1: base 'gross_payroll' usa la nómina del mes completa; el tope anual por empleado
--          (wage_cap/per_employee) queda como refinamiento futuro (§4 lo describe).

create or replace function public.tax_obligations_for(tid uuid, m0 date, m1 date)
returns jsonb language sql stable security definer set search_path = public as $$
  with agg as (
    select
      coalesce((select sum(amount) from public.income where tenant_id=tid and income_date>=m0 and income_date<m1 and deleted_at is null),0) as gi,
      coalesce((select sum(amount) from public.expenses where tenant_id=tid and expense_date>=m0 and expense_date<m1 and deleted_at is null),0) as ge,
      coalesce((select sum(amount) from public.payroll where tenant_id=tid and pay_date>=m0 and pay_date<m1 and deleted_at is null),0) as gp,
      coalesce((select sum(amount) from public.expenses where tenant_id=tid and expense_date>=m0 and expense_date<m1 and deleted_at is null and paid_by is not null and amount>500),0) as cp
  ),
  est as (
    select c.label, r.calc_type, r.rate, r.frequency, r.notes,
      case r.base_source when 'gross_income' then a.gi when 'gross_payroll' then a.gp
        when 'contractor_payments' then a.cp when 'net_income' then a.gi - a.ge else 0 end as base,
      case when r.calc_type='percentage' then round((case r.base_source when 'gross_income' then a.gi
             when 'gross_payroll' then a.gp when 'contractor_payments' then a.cp
             when 'net_income' then a.gi - a.ge else 0 end) * r.rate / 100, 2)
           when r.frequency='monthly' then r.rate
           when r.frequency='quarterly' then round(r.rate/3,2)
           else round(r.rate/12,2) end as estimated
    from public.tax_obligation_rules r
    join public.categories c on c.id = r.category_id
    cross join agg a
    where r.tenant_id = tid and r.active
  )
  select jsonb_build_object(
    'obligations', coalesce((select jsonb_agg(jsonb_build_object(
        'label',label,'calcType',calc_type,'rate',rate,'base',base,
        'estimated',estimated,'frequency',frequency,'notes',notes) order by label) from est),'[]'::jsonb),
    'total_estimated', coalesce((select sum(estimated) from est),0)
  );
$$;
grant execute on function public.tax_obligations_for(uuid, date, date) to authenticated;
