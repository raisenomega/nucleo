-- RRHH-7 — Vínculo horas→nómina (A) + ciclos/historial/360° de evaluaciones (B) + enforcement de capacitación (C).

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE A — Vínculo horas→pago en nómina
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.employee_details add column if not exists hourly_rate numeric;
alter table public.employee_details add column if not exists salary_type text;

-- gross calculado desde la asistencia real del período (horas × tasa + overtime × tasa × multiplicador).
create or replace function public.calculate_gross_from_attendance(p_employee_id uuid, p_from date, p_to date)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _t uuid := public.current_tenant(); _stype text; _rate numeric; _mult numeric; _gross numeric;
  _reg numeric; _ot numeric; _base numeric; _otpay numeric;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select coalesce(salary_type, 'hourly'), coalesce(hourly_rate, 0), coalesce(gross_salary, 0)
    into _stype, _rate, _gross from public.employee_details where profile_id = p_employee_id and tenant_id = _t;
  select coalesce(overtime_multiplier, 1.5) into _mult from public.attendance_config where tenant_id = _t;
  _mult := coalesce(_mult, 1.5);
  select coalesce(sum(hours_regular), 0), coalesce(sum(hours_overtime), 0) into _reg, _ot
    from public.employee_attendance where tenant_id = _t and employee_id = p_employee_id and work_date between p_from and p_to and status <> 'voided';
  if _stype = 'salary' then
    _base := coalesce(_gross, 0); _otpay := _ot * (_rate * _mult); _gross := _base + _otpay;
  else
    _base := round(_reg * _rate, 2); _otpay := round(_ot * _rate * _mult, 2); _gross := _base + _otpay;
  end if;
  return jsonb_build_object('regular_hours', _reg, 'overtime_hours', _ot, 'hourly_rate', _rate,
    'overtime_multiplier', _mult, 'salary_type', _stype, 'base_pay', _base, 'overtime_pay', _otpay, 'gross_total', round(_gross, 2));
end $$;
grant execute on function public.calculate_gross_from_attendance(uuid, date, date) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE B — Ciclos de evaluación + historial + 360° + recordatorios
-- ═══════════════════════════════════════════════════════════════════════════
create table public.evaluation_cycles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  cycle_type text not null default 'quarterly' check (cycle_type in ('monthly','quarterly','semi_annual','annual','custom')),
  period_start date not null, period_end date not null,
  evaluation_start date not null, evaluation_deadline date not null,
  perspectives jsonb default '["top_down"]'::jsonb, is_mandatory boolean default true,
  status text not null default 'draft' check (status in ('draft','active','closed','cancelled')),
  total_evaluations integer default 0, completed_evaluations integer default 0,
  created_by uuid not null references public.profiles(id), created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.evaluations add column if not exists cycle_id uuid references public.evaluation_cycles(id);
create trigger trg_eval_cycles_updated before update on public.evaluation_cycles for each row execute function public.set_updated_at();
alter table public.evaluation_cycles enable row level security;
create policy ec_sel on public.evaluation_cycles for select using (tenant_id = public.current_tenant());
create policy ec_wr on public.evaluation_cycles for all using (tenant_id = public.current_tenant() and public.is_ceo_or_above()) with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());

create or replace function public.create_evaluation_cycle(p_data jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _id uuid;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  insert into public.evaluation_cycles(tenant_id, name, cycle_type, period_start, period_end, evaluation_start, evaluation_deadline, perspectives, created_by)
    values (public.current_tenant(), p_data->>'name', coalesce(p_data->>'cycle_type','quarterly'), (p_data->>'period_start')::date, (p_data->>'period_end')::date,
      (p_data->>'evaluation_start')::date, (p_data->>'evaluation_deadline')::date, coalesce(p_data->'perspectives','["top_down"]'::jsonb), auth.uid())
    returning id into _id;
  return _id;
end $$;

-- activa el ciclo: genera evaluaciones placeholder (pending) por perspectiva + notifica a los evaluadores.
create or replace function public.activate_evaluation_cycle(p_cycle_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare c record; _emp record; _ceo uuid; _sup uuid; _n int := 0; _ev uuid;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select * into c from public.evaluation_cycles where id = p_cycle_id and tenant_id = public.current_tenant();
  if c.id is null or c.status <> 'draft' then raise exception 'Ciclo no activable'; end if;
  select user_id into _ceo from public.user_roles where tenant_id = c.tenant_id and role in ('ceo','superadmin') order by created_at limit 1;
  for _emp in select p.id, ur.role from public.profiles p join public.user_roles ur on ur.user_id = p.id where p.tenant_id = c.tenant_id loop
    if c.perspectives ? 'top_down' and _emp.role not in ('ceo','superadmin') then
      insert into public.evaluations(tenant_id, employee_id, period, in_probation, requires_legal_validation, status, evaluator_id, created_by, eval_type, is_anonymous, cycle_id)
        values (c.tenant_id, _emp.id, c.name, false, false, 'pending', _ceo, _ceo, 'top_down', false, c.id); _n := _n + 1;
    end if;
    if c.perspectives ? 'self' then
      insert into public.evaluations(tenant_id, employee_id, period, in_probation, requires_legal_validation, status, evaluator_id, created_by, eval_type, is_anonymous, cycle_id)
        values (c.tenant_id, _emp.id, c.name, false, false, 'pending', _emp.id, _emp.id, 'self', false, c.id); _n := _n + 1;
    end if;
    if c.perspectives ? 'bottom_up' then
      select supervisor_id into _sup from public.employee_details where profile_id = _emp.id and tenant_id = c.tenant_id;
      if _sup is not null then
        insert into public.evaluations(tenant_id, employee_id, period, in_probation, requires_legal_validation, status, evaluator_id, created_by, eval_type, is_anonymous, cycle_id)
          values (c.tenant_id, _sup, c.name, false, false, 'pending', _emp.id, _emp.id, 'bottom_up', true, c.id); _n := _n + 1;
      end if;
    end if;
  end loop;
  update public.evaluation_cycles set status = 'active', total_evaluations = _n, updated_at = now() where id = p_cycle_id;
  for _ev in select distinct evaluator_id from public.evaluations where cycle_id = c.id and status = 'pending' loop
    begin perform public._notify_user(c.tenant_id, _ev, 'eval_cycle', 'Ciclo de evaluación',
      'Se abrió "' || c.name || '". Fecha límite: ' || c.evaluation_deadline, 'evaluation', c.id); exception when others then null; end;
  end loop;
end $$;

-- rellena una evaluación pending del ciclo con scores (reutiliza la lógica de composite ponderado).
create or replace function public.complete_cycle_evaluation(p_eval_id uuid, p_scores jsonb, p_notes text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare e record; _sum numeric := 0; _wsum numeric := 0; _comp numeric; _class text; _w numeric; _item jsonb;
begin
  select * into e from public.evaluations where id = p_eval_id and tenant_id = public.current_tenant();
  if e.id is null then raise exception 'Evaluación no encontrada'; end if;
  if not (public.is_ceo_or_above() or e.evaluator_id = auth.uid()) then raise exception 'No autorizado'; end if;
  if e.status = 'final' then return; end if;
  for _item in select value from jsonb_array_elements(p_scores) loop
    select weight into _w from public.evaluation_criteria where id = (_item->>'criterion_id')::uuid and tenant_id = e.tenant_id;
    if _w is not null then _sum := _sum + (_item->>'score')::numeric * _w; _wsum := _wsum + _w; end if;
  end loop;
  _comp := case when _wsum > 0 then round(_sum / _wsum, 2) else 0 end;
  _class := case when _comp >= 9 then 'excelente' when _comp >= 7.5 then 'bueno' when _comp >= 6 then 'necesita_mejora' else 'insuficiente' end;
  update public.evaluations set composite_score = _comp, classification = _class, notes = coalesce(p_notes, notes), status = 'final', updated_at = now() where id = p_eval_id;
  delete from public.evaluation_scores where evaluation_id = p_eval_id;
  for _item in select value from jsonb_array_elements(p_scores) loop
    insert into public.evaluation_scores(tenant_id, evaluation_id, criterion_id, score) values (e.tenant_id, p_eval_id, (_item->>'criterion_id')::uuid, (_item->>'score')::numeric);
  end loop;
  update public.evaluation_cycles set completed_evaluations = (select count(*) from public.evaluations where cycle_id = e.cycle_id and status = 'final'), updated_at = now() where id = e.cycle_id;
end $$;

create or replace function public.get_cycle_evaluations(p_cycle_id uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'employee_id', e.employee_id, 'employee_name', pe.full_name,
    'evaluator_name', case when e.is_anonymous and not public.is_ceo_or_above() then 'Anónimo' else pv.full_name end,
    'eval_type', e.eval_type, 'status', e.status, 'score', e.composite_score) order by pe.full_name, e.eval_type), '[]'::jsonb)
  from public.evaluations e left join public.profiles pe on pe.id = e.employee_id left join public.profiles pv on pv.id = e.evaluator_id
  where e.cycle_id = p_cycle_id and e.tenant_id = public.current_tenant() and (public.is_ceo_or_above() or e.evaluator_id = auth.uid());
$$;

create or replace function public.get_employee_evaluation_history(p_employee_id uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when not (public.is_ceo_or_above() or p_employee_id = auth.uid()) then '[]'::jsonb else coalesce((
    select jsonb_agg(jsonb_build_object('period', e.period, 'score', e.composite_score, 'eval_type', e.eval_type,
      'cycle', c.name, 'created_at', e.created_at) order by e.created_at)
    from public.evaluations e left join public.evaluation_cycles c on c.id = e.cycle_id
    where e.tenant_id = public.current_tenant() and e.employee_id = p_employee_id and e.composite_score is not null), '[]'::jsonb) end;
$$;

create or replace function public.get_360_rollup(p_employee_id uuid, p_cycle_id uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'perspectives', coalesce((select jsonb_object_agg(t, jsonb_build_object('score', s, 'count', n)) from (
        select eval_type t, round(avg(composite_score), 2) s, count(*) n from public.evaluations
        where cycle_id = p_cycle_id and employee_id = p_employee_id and status = 'final' group by eval_type) x), '{}'::jsonb),
    'consolidated_score', (select round(avg(composite_score), 2) from public.evaluations where cycle_id = p_cycle_id and employee_id = p_employee_id and status = 'final'),
    'by_criteria', coalesce((select jsonb_agg(jsonb_build_object('name', label, 'avg', a) order by label) from (
        select cr.label, round(avg(es.score), 2) a from public.evaluation_scores es
        join public.evaluations e on e.id = es.evaluation_id join public.evaluation_criteria cr on cr.id = es.criterion_id
        where e.cycle_id = p_cycle_id and e.employee_id = p_employee_id and e.status = 'final' group by cr.label) y), '[]'::jsonb))
  where public.is_ceo_or_above() or p_employee_id = auth.uid();
$$;

create or replace function public.check_evaluation_reminders() returns void language plpgsql security definer set search_path to 'public' as $$
declare e record;
begin
  for e in select ev.id, ev.evaluator_id, ev.tenant_id, c.name, c.evaluation_deadline
    from public.evaluations ev join public.evaluation_cycles c on c.id = ev.cycle_id
    where c.status = 'active' and ev.status = 'pending' and c.evaluation_deadline between current_date and current_date + 7
      and not exists (select 1 from public.notifications n where n.entity_id = ev.id and n.kind = 'eval_reminder' and n.created_at::date = current_date)
  loop
    begin perform public._notify_user(e.tenant_id, e.evaluator_id, 'eval_reminder', 'Evaluación pendiente',
      'Tienes una evaluación pendiente en "' || e.name || '". Vence: ' || e.evaluation_deadline, 'evaluation', e.id); exception when others then null; end;
  end loop;
end $$;

grant execute on function public.create_evaluation_cycle(jsonb) to authenticated;
grant execute on function public.activate_evaluation_cycle(uuid) to authenticated;
grant execute on function public.complete_cycle_evaluation(uuid, jsonb, text) to authenticated;
grant execute on function public.get_cycle_evaluations(uuid) to authenticated;
grant execute on function public.get_employee_evaluation_history(uuid) to authenticated;
grant execute on function public.get_360_rollup(uuid, uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE C — Enforcement de capacitación obligatoria (cron). La sugerencia auto
-- desde evaluación baja se difiere (follow-up) — el valor está en ciclos/360/horas.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.check_required_training() returns void language plpgsql security definer set search_path to 'public' as $$
declare e record; _ceo uuid; _emp text;
begin
  for e in select en.id, en.tenant_id, en.employee_id, tc.title, en.due_date
    from public.training_enrollments en join public.training_courses tc on tc.id = en.course_id
    where tc.required and en.status <> 'completed' and en.due_date is not null and en.due_date < current_date
      and not exists (select 1 from public.notifications n where n.entity_id = en.id and n.kind = 'training_overdue' and n.created_at::date = current_date)
  loop
    select full_name into _emp from public.profiles where id = e.employee_id;
    begin perform public._notify_user(e.tenant_id, e.employee_id, 'training_overdue', 'Capacitación vencida', '"' || e.title || '" está pendiente y vencida', 'training', e.id); exception when others then null; end;
    for _ceo in select user_id from public.user_roles where tenant_id = e.tenant_id and role in ('ceo','superadmin') loop
      begin perform public._notify_user(e.tenant_id, _ceo, 'training_overdue', 'Capacitación vencida', coalesce(_emp,'') || ': ' || e.title, 'training', e.id); exception when others then null; end;
    end loop;
  end loop;
end $$;

do $$ begin if exists (select 1 from cron.job where jobname = 'eval-reminders') then perform cron.unschedule('eval-reminders'); end if; end $$;
select cron.schedule('eval-reminders', '0 9 * * *', $$select public.check_evaluation_reminders()$$);
do $$ begin if exists (select 1 from cron.job where jobname = 'required-training') then perform cron.unschedule('required-training'); end if; end $$;
select cron.schedule('required-training', '0 7 * * 1', $$select public.check_required_training()$$);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED demo (Zafacones, 4 empleados): ciclo Q3 activo + criterios + evals (2 completadas) + historial.
-- ═══════════════════════════════════════════════════════════════════════════
do $$
declare _t uuid := '61205cb9-1418-4bfa-a029-bbb44d4e4310';
  _roy uuid := 'fb9be0cb-d5c9-4bf7-b522-93614d09ba1c'; _yes uuid := '430fefcc-c9b0-4a28-b0dd-11da9e241be3';
  _joh uuid := 'e9bd1007-62d1-4bc7-b2cf-8e492bdd5028'; _ste uuid := 'd4768116-4e86-4b88-bf9e-8bc2d3a206a9'; _cid uuid; _e1 uuid;
begin
  if not exists (select 1 from public.tenants where id = _t) then return; end if;
  if exists (select 1 from public.evaluation_cycles where tenant_id = _t) then return; end if;
  if not exists (select 1 from public.evaluation_criteria where tenant_id = _t) then
    insert into public.evaluation_criteria(tenant_id, label, weight, sort) values (_t, 'Puntualidad', 1, 1), (_t, 'Calidad', 2, 2), (_t, 'Actitud', 1, 3);
  end if;
  insert into public.evaluation_cycles(tenant_id, name, cycle_type, period_start, period_end, evaluation_start, evaluation_deadline, perspectives, status, created_by, total_evaluations)
    values (_t, 'Evaluación Q3 2026', 'quarterly', current_date - 90, current_date, current_date - 5, current_date + 10, '["top_down","self"]'::jsonb, 'active', _roy, 6) returning id into _cid;
  insert into public.evaluations(tenant_id, employee_id, period, in_probation, requires_legal_validation, status, evaluator_id, created_by, eval_type, is_anonymous, cycle_id) values
    (_t, _joh, 'Evaluación Q3 2026', false, false, 'pending', _roy, _roy, 'top_down', false, _cid),
    (_t, _ste, 'Evaluación Q3 2026', false, false, 'pending', _roy, _roy, 'top_down', false, _cid),
    (_t, _roy, 'Evaluación Q3 2026', false, false, 'pending', _roy, _roy, 'self', false, _cid),
    (_t, _yes, 'Evaluación Q3 2026', false, false, 'pending', _yes, _yes, 'self', false, _cid),
    (_t, _joh, 'Evaluación Q3 2026', false, false, 'pending', _joh, _joh, 'self', false, _cid),
    (_t, _ste, 'Evaluación Q3 2026', false, false, 'pending', _ste, _ste, 'self', false, _cid);
  -- completar 2 (top_down Roy→Stephanie + self Stephanie)
  update public.evaluations set composite_score = 8.2, classification = 'bueno', status = 'final' where cycle_id = _cid and eval_type = 'top_down' and employee_id = _ste returning id into _e1;
  insert into public.evaluation_scores(tenant_id, evaluation_id, criterion_id, score) select _t, _e1, id, 8 from public.evaluation_criteria where tenant_id = _t and active;
  update public.evaluations set composite_score = 8.75, classification = 'bueno', status = 'final' where cycle_id = _cid and eval_type = 'self' and employee_id = _ste returning id into _e1;
  insert into public.evaluation_scores(tenant_id, evaluation_id, criterion_id, score) select _t, _e1, id, 9 from public.evaluation_criteria where tenant_id = _t and active;
  update public.evaluation_cycles set completed_evaluations = 2 where id = _cid;
  -- historial: una evaluación previa (Q2) de Stephanie para la gráfica de evolución
  insert into public.evaluations(tenant_id, employee_id, period, composite_score, classification, in_probation, requires_legal_validation, status, evaluator_id, created_by, eval_type, is_anonymous, created_at)
    values (_t, _ste, 'Q2 2026', 7.5, 'bueno', false, false, 'final', _roy, _roy, 'top_down', false, now() - interval '90 days');
end $$;
