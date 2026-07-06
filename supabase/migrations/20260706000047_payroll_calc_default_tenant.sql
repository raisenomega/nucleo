-- 20260706000047_payroll_calc_default_tenant.sql
-- calculate_payroll_deductions: p_tenant_id con default current_tenant() para que el cliente
-- (infra, sin acceso a la sesión) lo llame pasando solo gross + worker_type. Misma lógica que 00044.

create or replace function public.calculate_payroll_deductions(
  p_tenant_id uuid default public.current_tenant(), p_gross numeric default 0, p_worker_type text default 'employee'
) returns jsonb language sql stable security definer set search_path = public as $$
  with r as (
    select label, applies_to, rate,
      case when calc_type='fixed_amount' then rate else round(p_gross*rate/100,2) end as amt
    from public.payroll_deduction_rules
    where tenant_id=p_tenant_id and active
      and applies_to = any(case when p_worker_type='contractor' then array['contractor'] else array['employee','employer'] end)
  ),
  a as (
    select
      coalesce(jsonb_agg(jsonb_build_object('label',label,'rate',rate,'base',p_gross,'amount',amt) order by label) filter (where applies_to in ('employee','contractor')),'[]'::jsonb) as ded,
      coalesce(jsonb_agg(jsonb_build_object('label',label,'rate',rate,'base',p_gross,'amount',amt) order by label) filter (where applies_to='employer'),'[]'::jsonb) as con,
      coalesce(sum(amt) filter (where applies_to in ('employee','contractor')),0) as ted,
      coalesce(sum(amt) filter (where applies_to='employer'),0) as tec
    from r
  )
  select jsonb_build_object('gross',p_gross,'employee_deductions',ded,'employer_contributions',con,
    'total_employee_deductions',ted,'total_employer_contributions',tec,
    'net_salary',p_gross-ted,'total_employer_cost',p_gross+tec) from a;
$$;
grant execute on function public.calculate_payroll_deductions(uuid,numeric,text) to authenticated;
