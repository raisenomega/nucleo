-- RRHH-4 — Onboarding automatizado: templates de checklist + instancia por empleado + tareas.
-- Al contratar (convert_applicant_to_employee / trigger), se genera el checklist automáticamente
-- desde el template del puesto (o el default del tenant). El empleado completa sus tareas (firma,
-- documento, capacitación); el staff completa las de 'admin'. Progreso en el dashboard.
-- Nota: onboarding_templates.created_by es NULLABLE (los templates de sistema/seed no tienen creador).

create table public.onboarding_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  position_id uuid references public.job_positions(id),
  tasks jsonb not null default '[]'::jsonb,
  is_default boolean default false, is_active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table public.onboarding_checklists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.profiles(id),
  template_id uuid references public.onboarding_templates(id),
  applicant_id uuid references public.applicants(id),
  position_title text,
  status text not null default 'in_progress' check (status in ('in_progress','completed','cancelled')),
  started_at timestamptz default now(), completed_at timestamptz,
  total_tasks integer default 0, completed_tasks integer default 0,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (tenant_id, employee_id)
);

create table public.onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.onboarding_checklists(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null, description text,
  category text default 'other' check (category in ('legal','documents','it','training','equipment','introduction','other')),
  assigned_to text not null default 'employee' check (assigned_to in ('employee','admin','mentor')),
  task_order integer not null default 0,
  requires_signature boolean default false, requires_document boolean default false,
  linked_training_id uuid references public.training_courses(id),
  status text not null default 'pending' check (status in ('pending','in_progress','completed','skipped')),
  completed_at timestamptz, completed_by uuid references public.profiles(id),
  signature_data text, document_url text, notes text, due_date date,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index idx_onboarding_tasks_checklist on public.onboarding_tasks(checklist_id);

create trigger trg_ob_tpl_updated before update on public.onboarding_templates for each row execute function public.set_updated_at();
create trigger trg_ob_ck_updated before update on public.onboarding_checklists for each row execute function public.set_updated_at();
create trigger trg_ob_task_updated before update on public.onboarding_tasks for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.onboarding_templates enable row level security;
alter table public.onboarding_checklists enable row level security;
alter table public.onboarding_tasks enable row level security;
create policy ot_sel on public.onboarding_templates for select using (tenant_id = public.current_tenant());
create policy ot_wr on public.onboarding_templates for all using (tenant_id = public.current_tenant() and public.is_ceo_or_above()) with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());
create policy oc_sel on public.onboarding_checklists for select using (tenant_id = public.current_tenant() and (public.is_ceo_or_above() or employee_id = auth.uid()));
create policy otk_sel on public.onboarding_tasks for select using (tenant_id = public.current_tenant() and (public.is_ceo_or_above() or exists (select 1 from public.onboarding_checklists c where c.id = checklist_id and c.employee_id = auth.uid())));

-- ═══════════════════════════════════════════════════════════════════════════
-- CREADOR interno (sin gate) — usado por el RPC público y por la contratación auto.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public._create_onboarding_checklist(p_employee uuid, p_template uuid default null, p_applicant uuid default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _t uuid; _tpl record; _pos uuid; _postitle text; _cid uuid; _task jsonb; _start timestamptz := now(); _n int := 0; _tr uuid;
begin
  select tenant_id into _t from public.profiles where id = p_employee;
  if _t is null then return null; end if;
  if exists (select 1 from public.onboarding_checklists where tenant_id = _t and employee_id = p_employee) then return null; end if;
  if p_applicant is not null then
    select jp.id, jp.title into _pos, _postitle from public.applicants ap
      join public.job_openings o on o.id = ap.opening_id join public.job_positions jp on jp.id = o.position_id where ap.id = p_applicant;
  end if;
  if p_template is not null then select * into _tpl from public.onboarding_templates where id = p_template and tenant_id = _t;
  elsif _pos is not null then select * into _tpl from public.onboarding_templates where tenant_id = _t and position_id = _pos and is_active order by created_at limit 1;
  else select * into _tpl from public.onboarding_templates where tenant_id = _t and is_default and is_active order by created_at limit 1; end if;
  if _tpl.id is null then select * into _tpl from public.onboarding_templates where tenant_id = _t and is_default and is_active order by created_at limit 1; end if;
  insert into public.onboarding_checklists(tenant_id, employee_id, template_id, applicant_id, position_title, started_at)
    values (_t, p_employee, _tpl.id, p_applicant, _postitle, _start) returning id into _cid;
  if _tpl.id is not null then
    for _task in select value from jsonb_array_elements(coalesce(_tpl.tasks, '[]'::jsonb)) loop
      insert into public.onboarding_tasks(checklist_id, tenant_id, title, description, category, assigned_to, task_order,
        requires_signature, requires_document, linked_training_id, due_date)
      values (_cid, _t, _task->>'title', _task->>'description', coalesce(_task->>'category','other'), coalesce(_task->>'assigned_to','employee'),
        coalesce((_task->>'order')::int, _n), coalesce((_task->>'requires_signature')::bool, false), coalesce((_task->>'requires_document')::bool, false),
        (_task->'linked_training_ids'->>0)::uuid, (_start + (coalesce((_task->>'due_days')::int, 7) || ' days')::interval)::date);
      _n := _n + 1;
    end loop;
  end if;
  if _pos is not null then
    for _tr in select unnest(required_training_ids) from public.job_positions where id = _pos loop
      if not exists (select 1 from public.onboarding_tasks where checklist_id = _cid and linked_training_id = _tr) then
        insert into public.onboarding_tasks(checklist_id, tenant_id, title, category, assigned_to, task_order, linked_training_id, due_date)
          values (_cid, _t, 'Completar: ' || coalesce((select title from public.training_courses where id = _tr), 'capacitación'), 'training', 'employee', _n, _tr, (_start + interval '14 days')::date);
        _n := _n + 1;
      end if;
    end loop;
  end if;
  update public.onboarding_checklists set total_tasks = _n where id = _cid;
  return _cid;
end $$;

-- Integración: al vincular un candidato contratado (ambos caminos) → crea el onboarding.
create or replace function public._attach_employee_from_applicant(_pid uuid, _aid uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare a record;
begin
  select * into a from public.applicants where id = _aid;
  update public.applicants set converted_profile_id = _pid, converted_at = now(),
    stage = 'hired', decision = 'approved', updated_at = now() where id = _aid;
  insert into public.employee_details(profile_id, tenant_id, personal_phone, personal_email,
    address_line1, city, state_province, zip_code)
  values (_pid, a.tenant_id, a.phone, a.email, a.address, a.city, a.state, a.zip_code)
  on conflict (tenant_id, profile_id) do nothing;
  begin perform public._create_onboarding_checklist(_pid, null, _aid); exception when others then null; end;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPCs
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.create_onboarding_checklist(p_employee_id uuid, p_template_id uuid default null, p_applicant_id uuid default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  return public._create_onboarding_checklist(p_employee_id, p_template_id, p_applicant_id);
end $$;

create or replace function public.complete_onboarding_task(p_task_id uuid, p_signature_data text default null, p_document_url text default null, p_notes text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare tk record; _done int; _emp text; _ceo uuid;
begin
  select t.*, c.employee_id as ck_emp, c.id as cid into tk from public.onboarding_tasks t
    join public.onboarding_checklists c on c.id = t.checklist_id where t.id = p_task_id;
  if tk.id is null then raise exception 'Tarea no encontrada'; end if;
  if not (public.is_ceo_or_above() or (tk.ck_emp = auth.uid() and tk.assigned_to = 'employee')) then raise exception 'No autorizado'; end if;
  if tk.status = 'completed' then return; end if;
  if tk.requires_signature and nullif(p_signature_data, '') is null then raise exception 'Requiere firma'; end if;
  if tk.requires_document and nullif(p_document_url, '') is null then raise exception 'Requiere documento'; end if;
  if tk.linked_training_id is not null and not exists (select 1 from public.training_enrollments where employee_id = tk.ck_emp and course_id = tk.linked_training_id and status = 'completed') then
    raise exception 'Completa primero el curso vinculado'; end if;
  update public.onboarding_tasks set status = 'completed', completed_at = now(), completed_by = auth.uid(),
    signature_data = p_signature_data, document_url = p_document_url, notes = p_notes, updated_at = now() where id = p_task_id;
  select count(*) filter (where status in ('completed','skipped')) into _done from public.onboarding_tasks where checklist_id = tk.cid;
  update public.onboarding_checklists set completed_tasks = _done,
    status = case when _done >= total_tasks then 'completed' else status end,
    completed_at = case when _done >= total_tasks then now() else completed_at end, updated_at = now() where id = tk.cid;
  select full_name into _emp from public.profiles where id = tk.ck_emp;
  for _ceo in select user_id from public.user_roles where tenant_id = tk.tenant_id and role in ('ceo','coo','superadmin') loop
    begin perform public._notify_user(tk.tenant_id, _ceo, 'onboarding_task', 'Onboarding', coalesce(_emp,'') || ' completó: ' || tk.title, 'onboarding', tk.cid); exception when others then null; end;
  end loop;
end $$;

create or replace function public.skip_onboarding_task(p_task_id uuid) returns void language plpgsql security definer set search_path to 'public' as $$
declare _cid uuid; _done int;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  update public.onboarding_tasks set status = 'skipped', updated_at = now()
    where id = p_task_id and tenant_id = public.current_tenant() and status <> 'completed' returning checklist_id into _cid;
  if _cid is null then return; end if;
  select count(*) filter (where status in ('completed','skipped')) into _done from public.onboarding_tasks where checklist_id = _cid;
  update public.onboarding_checklists set completed_tasks = _done,
    status = case when _done >= total_tasks then 'completed' else status end,
    completed_at = case when _done >= total_tasks then now() else completed_at end, updated_at = now() where id = _cid;
end $$;

create or replace function public.get_onboarding_status(p_employee_id uuid) returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when not (public.is_ceo_or_above() or p_employee_id = auth.uid()) then null else (
    select jsonb_build_object('checklist', to_jsonb(c) - 'tenant_id',
      'tasks', coalesce((select jsonb_agg(to_jsonb(t) - 'tenant_id' order by t.task_order) from public.onboarding_tasks t where t.checklist_id = c.id), '[]'::jsonb))
    from public.onboarding_checklists c where c.tenant_id = public.current_tenant() and c.employee_id = p_employee_id
    order by c.created_at desc limit 1) end;
$$;

create or replace function public.create_onboarding_template(p_data jsonb) returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _id uuid;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  insert into public.onboarding_templates(tenant_id, name, position_id, tasks, is_default, created_by)
    values (public.current_tenant(), p_data->>'name', (p_data->>'position_id')::uuid, coalesce(p_data->'tasks','[]'::jsonb),
      coalesce((p_data->>'is_default')::bool, false), auth.uid()) returning id into _id;
  return _id;
end $$;

create or replace function public.update_onboarding_template(p_id uuid, p_data jsonb) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  update public.onboarding_templates set name = coalesce(p_data->>'name', name), position_id = (p_data->>'position_id')::uuid,
    tasks = coalesce(p_data->'tasks', tasks), is_default = coalesce((p_data->>'is_default')::bool, is_default),
    is_active = coalesce((p_data->>'is_active')::bool, is_active), updated_at = now()
  where id = p_id and tenant_id = public.current_tenant();
end $$;

grant execute on function public.create_onboarding_checklist(uuid, uuid, uuid) to authenticated;
grant execute on function public.complete_onboarding_task(uuid, text, text, text) to authenticated;
grant execute on function public.skip_onboarding_task(uuid) to authenticated;
grant execute on function public.get_onboarding_status(uuid) to authenticated;
grant execute on function public.create_onboarding_template(jsonb) to authenticated;
grant execute on function public.update_onboarding_template(uuid, jsonb) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED — template "Onboarding General" para todos los tenants + los nuevos vía trigger.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public._seed_onboarding_template(_t uuid) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if exists (select 1 from public.onboarding_templates where tenant_id = _t and is_default) then return; end if;
  insert into public.onboarding_templates(tenant_id, name, is_default, tasks) values (_t, 'Onboarding General', true, '[
    {"id":"t1","title":"Firmar contrato de trabajo","description":"Revisar y firmar el contrato de empleo","category":"legal","assigned_to":"employee","requires_signature":true,"due_days":3,"order":1},
    {"id":"t2","title":"Entregar documentos de identidad","category":"documents","assigned_to":"employee","requires_document":true,"due_days":5,"order":2},
    {"id":"t3","title":"Entregar información bancaria","category":"documents","assigned_to":"employee","requires_document":true,"due_days":5,"order":3},
    {"id":"t4","title":"Configurar acceso al sistema","category":"it","assigned_to":"admin","due_days":1,"order":4},
    {"id":"t5","title":"Entrega de equipo de trabajo","category":"equipment","assigned_to":"admin","due_days":3,"order":5},
    {"id":"t6","title":"Presentación al equipo","category":"introduction","assigned_to":"admin","due_days":2,"order":6},
    {"id":"t7","title":"Revisar políticas y reglamento","category":"legal","assigned_to":"employee","requires_signature":true,"due_days":7,"order":7},
    {"id":"t8","title":"Completar capacitación obligatoria","category":"training","assigned_to":"employee","due_days":14,"order":8}]'::jsonb);
end $$;
create or replace function public._seed_onboarding_trg() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin perform public._seed_onboarding_template(new.id); return new; end $$;
drop trigger if exists trg_seed_onboarding on public.tenants;
create trigger trg_seed_onboarding after insert on public.tenants for each row execute function public._seed_onboarding_trg();
select public._seed_onboarding_template(id) from public.tenants;

-- Demo (Zafacones): onboarding activo para Stephanie con 4/8 tareas completadas.
do $$
declare _steph uuid := 'd4768116-4e86-4b88-bf9e-8bc2d3a206a9'; _cid uuid; _done int;
begin
  if not exists (select 1 from public.profiles where id = _steph) then return; end if;
  if exists (select 1 from public.onboarding_checklists where employee_id = _steph) then return; end if;
  _cid := public._create_onboarding_checklist(_steph, null, null);
  if _cid is null then return; end if;
  update public.onboarding_tasks set status = 'completed', completed_at = now() - interval '2 days', completed_by = _steph
    where checklist_id = _cid and task_order in (1, 2, 3, 4);
  select count(*) filter (where status in ('completed','skipped')) into _done from public.onboarding_tasks where checklist_id = _cid;
  update public.onboarding_checklists set completed_tasks = _done, position_title = 'Servicio' where id = _cid;
end $$;
