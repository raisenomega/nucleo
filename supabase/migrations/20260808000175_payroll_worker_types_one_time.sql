-- payroll-types — nómina solo tenía 'employee'/'contractor'. Se agregan 5 tipos para pagos a terceros no recurrentes
-- (helper/speaker/consultant/technician/freelancer) + el período 'Pago único'. Fiscalmente los 5 nuevos se tratan
-- como CONTRATISTA: calculate_payroll_deductions pasa de ramificar en ='contractor' a <>'employee' (los nuevos NO
-- llevan contribuciones patronales; solo las deducciones 'contractor' si el tenant las tiene). La base fiscal
-- (tax_obligations_for) no cambia: gross_payroll ya suma TODA la payroll y la retención 10% a contratistas sale de
-- expenses (paid_by, >$500) — los nuevos tipos se comportan idéntico a 'contractor' sin tocar el motor fiscal.

alter type public.payroll_period add value if not exists 'Pago único';

alter table public.payroll drop constraint if exists payroll_worker_type_check;
alter table public.payroll add constraint payroll_worker_type_check
  check (worker_type in ('employee','contractor','helper','speaker','consultant','technician','freelancer'));

create or replace function public.calculate_payroll_deductions(p_tenant_id uuid default current_tenant(), p_gross numeric default 0, p_worker_type text default 'employee')
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  with r as (
    select label, applies_to, rate,
      case when calc_type='fixed_amount' then rate else round(p_gross*rate/100,2) end as amt
    from public.payroll_deduction_rules
    where tenant_id=p_tenant_id and active
      and applies_to = any(case when p_worker_type <> 'employee' then array['contractor'] else array['employee','employer'] end)
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
$function$;
