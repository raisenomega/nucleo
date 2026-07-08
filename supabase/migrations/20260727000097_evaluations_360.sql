-- 20260727000097_evaluations_360.sql
-- EVALUACIONES 360°: tipo de evaluación (top_down/peer/bottom_up/self) + anonimato.
-- RLS por tipo: top_down = solo ceo/coo (is_coo_or_above); self = sobre uno mismo; peer/bottom_up = sobre otro.
-- VER: ceo/coo todo; el empleado sus propias (recibidas o enviadas). save_evaluation acepta tipo + anónimo.

alter table public.evaluations add column if not exists eval_type text not null default 'top_down'
  check (eval_type in ('top_down','peer','bottom_up','self'));
alter table public.evaluations add column if not exists is_anonymous boolean not null default false;

drop policy if exists eval_sel on public.evaluations;
create policy eval_sel on public.evaluations for select to authenticated using (
  tenant_id = public.current_tenant()
  and (public.is_coo_or_above() or employee_id = auth.uid() or evaluator_id = auth.uid()));

drop policy if exists eval_ins on public.evaluations;
create policy eval_ins on public.evaluations for insert to authenticated with check (
  tenant_id = public.current_tenant() and (
    (eval_type = 'top_down' and public.is_coo_or_above())
    or (eval_type = 'self' and employee_id = auth.uid())
    or (eval_type in ('peer','bottom_up') and employee_id <> auth.uid())));

drop policy if exists eval_sc_sel on public.evaluation_scores;
create policy eval_sc_sel on public.evaluation_scores for select to authenticated using (
  tenant_id = public.current_tenant() and (public.is_coo_or_above() or exists (
    select 1 from public.evaluations e where e.id = evaluation_scores.evaluation_id
      and (e.employee_id = auth.uid() or e.evaluator_id = auth.uid()))));

-- save_evaluation ampliado: gating por tipo. Reemplaza la firma de 4 args por una de 6.
drop function if exists public.save_evaluation(uuid, text, jsonb, text);
create or replace function public.save_evaluation(
  p_employee_id uuid, p_period text, p_scores jsonb, p_notes text default null,
  p_eval_type text default 'top_down', p_is_anonymous boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare _tenant uuid := public.current_tenant(); _eval uuid; _sum numeric := 0; _wsum numeric := 0;
  _comp numeric; _class text; _probend date; _inprob boolean; _item jsonb; _w numeric;
begin
  if p_eval_type = 'top_down' then
    if not public.is_coo_or_above() then raise exception 'Solo ceo/coo pueden hacer evaluación formal'; end if;
  elsif p_eval_type = 'self' then
    if p_employee_id <> auth.uid() then raise exception 'La auto-evaluación es solo sobre uno mismo'; end if;
  elsif p_eval_type in ('peer','bottom_up') then
    if p_employee_id = auth.uid() then raise exception 'Peer/bottom-up debe ser sobre otra persona'; end if;
  else raise exception 'Tipo de evaluación inválido'; end if;

  for _item in select * from jsonb_array_elements(p_scores) loop
    select weight into _w from evaluation_criteria where id = (_item->>'criterion_id')::uuid and tenant_id = _tenant;
    if _w is not null then _sum := _sum + (_item->>'score')::numeric * _w; _wsum := _wsum + _w; end if;
  end loop;
  _comp := case when _wsum > 0 then round(_sum / _wsum, 2) else 0 end;
  _class := case when _comp >= 9 then 'excelente' when _comp >= 7.5 then 'bueno'
                 when _comp >= 6 then 'necesita_mejora' else 'insuficiente' end;
  select probation_end_date into _probend from employee_details where profile_id = p_employee_id and tenant_id = _tenant;
  _inprob := _probend is not null and _probend >= current_date;

  insert into evaluations(tenant_id, employee_id, period, composite_score, classification, in_probation,
    requires_legal_validation, notes, eval_type, is_anonymous, evaluator_id, created_by)
    values(_tenant, p_employee_id, p_period, _comp, _class, _inprob,
      (_class = 'insuficiente' and not _inprob and p_eval_type = 'top_down'), p_notes, p_eval_type, p_is_anonymous, auth.uid(), auth.uid())
    returning id into _eval;
  for _item in select * from jsonb_array_elements(p_scores) loop
    insert into evaluation_scores(tenant_id, evaluation_id, criterion_id, score)
      values(_tenant, _eval, (_item->>'criterion_id')::uuid, (_item->>'score')::numeric);
  end loop;
  return _eval;
end $$;
grant execute on function public.save_evaluation(uuid, text, jsonb, text, text, boolean) to authenticated;
