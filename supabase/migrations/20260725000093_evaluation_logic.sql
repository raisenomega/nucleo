-- 20260725000093_evaluation_logic.sql
-- MÓDULO EVALUACIONES (2/2): guardar evaluación (composite ponderado + clasificación + Ley 80) y
-- auto-sugerir score operacional desde datos reales de desempeño (get_employee_performance-style).

-- save_evaluation: composite = Σ(score×weight)/Σ(weight); clasifica; marca probatorio (probation_end_date)
-- y requires_legal_validation = insuficiente Y fuera de probatorio (Ley 80 PR: despido con causa documentada).
create or replace function public.save_evaluation(p_employee_id uuid, p_period text, p_scores jsonb, p_notes text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare _tenant uuid := public.current_tenant(); _eval uuid; _sum numeric := 0; _wsum numeric := 0;
  _comp numeric; _class text; _probend date; _inprob boolean; _item jsonb; _w numeric;
begin
  if not public.can_access_module('evaluations','create') then raise exception 'No autorizado'; end if;
  for _item in select * from jsonb_array_elements(p_scores) loop
    select weight into _w from evaluation_criteria where id = (_item->>'criterion_id')::uuid and tenant_id = _tenant;
    if _w is not null then
      _sum := _sum + (_item->>'score')::numeric * _w;
      _wsum := _wsum + _w;
    end if;
  end loop;
  _comp := case when _wsum > 0 then round(_sum / _wsum, 2) else 0 end;
  _class := case when _comp >= 9 then 'excelente' when _comp >= 7.5 then 'bueno'
                 when _comp >= 6 then 'necesita_mejora' else 'insuficiente' end;
  select probation_end_date into _probend from employee_details where profile_id = p_employee_id and tenant_id = _tenant;
  _inprob := _probend is not null and _probend >= current_date;

  insert into evaluations(tenant_id, employee_id, period, composite_score, classification,
    in_probation, requires_legal_validation, notes, evaluator_id, created_by)
    values(_tenant, p_employee_id, p_period, _comp, _class, _inprob,
      (_class = 'insuficiente' and not _inprob), p_notes, auth.uid(), auth.uid())
    returning id into _eval;
  for _item in select * from jsonb_array_elements(p_scores) loop
    insert into evaluation_scores(tenant_id, evaluation_id, criterion_id, score)
      values(_tenant, _eval, (_item->>'criterion_id')::uuid, (_item->>'score')::numeric);
  end loop;
  return _eval;
end $$;
grant execute on function public.save_evaluation(uuid, text, jsonb, text) to authenticated;

-- suggest_evaluation_scores: score operacional 0-10 desde rutas (completadas/no atendidas/cobro).
-- Guard estilo H3: si el rol no puede ver evaluaciones, tid=null y todo vuelve en 0.
create or replace function public.suggest_evaluation_scores(p_employee_id uuid, p_from date, p_to date)
returns jsonb language sql stable security definer set search_path = public as $$
  with g as (select case when public.can_access_module('evaluations','view') then public.current_tenant() else null end as tid),
  m as (
    select
      (select count(*) from route_stops s join service_routes r on r.id=s.route_id
        where r.assigned_to=p_employee_id and r.tenant_id=(select tid from g) and r.route_date between p_from and p_to and s.status='Completada') as completed,
      (select count(*) from route_stops s join service_routes r on r.id=s.route_id
        where r.assigned_to=p_employee_id and r.tenant_id=(select tid from g) and r.route_date between p_from and p_to and s.status='No atendido') as not_attended,
      (select coalesce(sum(s.actual_amount),0) from route_stops s join service_routes r on r.id=s.route_id
        where r.assigned_to=p_employee_id and r.tenant_id=(select tid from g) and r.route_date between p_from and p_to and s.linked_income_id is not null) as collected
  )
  select jsonb_build_object(
    'completed', completed, 'not_attended', not_attended, 'collected', collected,
    'completion_rate', case when completed+not_attended>0 then round(100.0*completed/(completed+not_attended),1) else 0 end,
    'suggested_operational', case when completed+not_attended>0 then round((100.0*completed/(completed+not_attended))/10.0, 1) else 0 end
  ) from m;
$$;
grant execute on function public.suggest_evaluation_scores(uuid, date, date) to authenticated;
