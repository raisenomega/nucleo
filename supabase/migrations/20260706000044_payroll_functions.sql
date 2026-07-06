-- 20260706000044_payroll_functions.sql
-- Cálculo automático de deducciones (v1 SIN tope YTD: rate sobre el bruto del período) + resumen de nómina.

create or replace function public.calculate_payroll_deductions(p_tenant_id uuid, p_gross numeric, p_worker_type text default 'employee')
returns jsonb language sql stable security definer set search_path = public as $$
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

create or replace function public.get_payroll_summary(p_month date default current_date)
returns jsonb language sql stable security definer set search_path = public as $$
  with t as (select public.current_tenant() as tid, date_trunc('month',p_month)::date as m0,
                    (date_trunc('month',p_month)+interval '1 month')::date as m1),
  p as (
    select pf.full_name,
      coalesce(nullif(pr.gross_salary,0),pr.amount) as gross,
      coalesce(nullif(pr.net_salary,0),pr.amount) as net,
      coalesce(nullif(pr.total_employer_cost,0),pr.amount) as cost
    from t join public.payroll pr on pr.tenant_id=t.tid and pr.pay_date>=t.m0 and pr.pay_date<t.m1 and pr.deleted_at is null
    left join public.profiles pf on pf.id=pr.employee_id
  )
  select jsonb_build_object(
    'total_gross',coalesce((select sum(gross) from p),0),
    'total_net',coalesce((select sum(net) from p),0),
    'total_employer_cost',coalesce((select sum(cost) from p),0),
    'total_withheld',coalesce((select sum(gross-net) from p),0),
    'by_employee',coalesce((select jsonb_agg(jsonb_build_object('name',coalesce(full_name,'—'),'gross',gross,'net',net,'cost',cost) order by full_name) from p),'[]'::jsonb));
$$;
grant execute on function public.get_payroll_summary(date) to authenticated;
