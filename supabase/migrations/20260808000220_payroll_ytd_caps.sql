-- 220 · Ola 1.3a · Tope anual (YTD) en deducciones de nómina.
--
-- BUG (auditoría ERP): la función recibía solo (tenant, gross, worker_type) — estructuralmente no podía saber
-- cuánto lleva pagado el trabajador en el año, así que `wage_cap` (FICA $184,500 · SINOT $9,000 · PRUI/FUTA
-- $7,000) NO se aplicaba nunca: cada regla cobraba su % sobre el bruto de CADA período, todo el año.
-- Impacto hoy: latente ($0 sobrecobrado — nadie supera caps aún, Zafacones no tiene reglas). Se corrige antes
-- de que muerda.
--
-- FIX: firma extendida con (p_employee_id, p_external_worker_id, p_pay_date, p_exclude_id), todos con default
-- → la llamada actual del frontend {p_gross, p_worker_type} sigue funcionando (sin trabajador ⇒ ytd=0 ⇒
-- comportamiento de hoy). Para reglas con wage_cap: base gravable = max(0, min(gross, cap − ytd_prior)).
-- Reglas sin cap (Medicare, ISR) y fixed_amount: SIN CAMBIO. `p_exclude_id` excluye el registro que se edita
-- (evita doble conteo en recálculos). El jsonb ahora expone la base gravable real por regla + ytd_prior raíz.
--
-- DROP + CREATE (no OR REPLACE): añadir parámetros crearía una SOBRECARGA (3-args y 7-args coexistiendo) y
-- PostgREST fallaría por ambigüedad al resolver named args. Verificado: cero funciones SQL la llaman; el único
-- call site es el frontend.

drop function if exists public.calculate_payroll_deductions(uuid, numeric, text);

create function public.calculate_payroll_deductions(
  p_tenant_id uuid default current_tenant(),
  p_gross numeric default 0,
  p_worker_type text default 'employee',
  p_employee_id uuid default null,
  p_external_worker_id uuid default null,
  p_pay_date date default current_date,
  p_exclude_id uuid default null)
returns jsonb language sql stable security definer set search_path = public as $function$
  with ytd as (
    -- Bruto YA pagado al MISMO trabajador en el año de p_pay_date (excluyendo el registro en edición).
    -- Sin trabajador identificado (ambos ids null) el filtro no matchea nada → prior = 0 (retrocompatible).
    select coalesce(sum(gross_salary), 0) as prior
    from public.payroll
    where tenant_id = p_tenant_id and deleted_at is null
      and extract(year from pay_date) = extract(year from p_pay_date)
      and (p_exclude_id is null or id <> p_exclude_id)
      and ((p_employee_id is not null and employee_id = p_employee_id)
        or (p_external_worker_id is not null and external_worker_id = p_external_worker_id))
  ),
  r as (
    select d.label, d.applies_to, d.rate, b.base,
      case when d.calc_type = 'fixed_amount' then d.rate else round(b.base * d.rate / 100, 2) end as amt
    from public.payroll_deduction_rules d
    cross join lateral (
      select case when d.wage_cap is null then p_gross
                  else greatest(0, least(p_gross, d.wage_cap - (select prior from ytd))) end as base
    ) b
    where d.tenant_id = p_tenant_id and d.active
      and d.applies_to = any(case when p_worker_type <> 'employee' then array['contractor'] else array['employee','employer'] end)
  ),
  a as (
    select
      coalesce(jsonb_agg(jsonb_build_object('label',label,'rate',rate,'base',base,'amount',amt) order by label) filter (where applies_to in ('employee','contractor')),'[]'::jsonb) as ded,
      coalesce(jsonb_agg(jsonb_build_object('label',label,'rate',rate,'base',base,'amount',amt) order by label) filter (where applies_to='employer'),'[]'::jsonb) as con,
      coalesce(sum(amt) filter (where applies_to in ('employee','contractor')),0) as ted,
      coalesce(sum(amt) filter (where applies_to='employer'),0) as tec
    from r
  )
  select jsonb_build_object('gross',p_gross,'ytd_prior',(select prior from ytd),
    'employee_deductions',ded,'employer_contributions',con,
    'total_employee_deductions',ted,'total_employer_contributions',tec,
    'net_salary',p_gross-ted,'total_employer_cost',p_gross+tec) from a;
$function$;

revoke execute on function public.calculate_payroll_deductions(uuid,numeric,text,uuid,uuid,date,uuid) from public, anon;
grant execute on function public.calculate_payroll_deductions(uuid,numeric,text,uuid,uuid,date,uuid) to authenticated;
