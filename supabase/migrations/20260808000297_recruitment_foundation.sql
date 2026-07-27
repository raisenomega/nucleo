-- RRHH-1A-1 — Reclutamiento (backend fundacional): Puestos + Vacantes + Candidatos + Pipeline.
-- Terreno virgen (la auditoría confirmó cero código de reclutamiento). Diseño guiado por
-- docs-nucleo/RRHH-NUCLEO.md Partes 5+9, adaptado a los patrones de NÚCLEO (numeración tipo
-- CC/JE/VB, invite real vía allowed_emails+handle_new_user, buckets tipo income_evidence).
-- Flujo: puesto → vacante → publicar → candidato aplica (público) → pipeline → convertir a empleado.

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLAS
-- ═══════════════════════════════════════════════════════════════════════════
create table public.job_positions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  department text,
  description text,
  responsibilities text,
  employment_type text not null default 'full_time'
    check (employment_type in ('full_time','part_time','contract','temporary','intern')),
  schedule text,
  location text,
  is_remote boolean default false,
  salary_type text default 'hourly' check (salary_type in ('hourly','salary','commission','mixed')),
  salary_min numeric,
  salary_max numeric,
  currency text default 'USD',
  requirements jsonb default '[]'::jsonb,
  required_documents jsonb default '[]'::jsonb,
  required_certifications jsonb default '[]'::jsonb,
  skills jsonb default '[]'::jsonb,
  min_experience_months integer default 0,
  education_level text,
  required_training_ids uuid[] default '{}',
  required_exam_ids uuid[] default '{}',
  is_active boolean not null default true,
  positions_count integer default 1,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.job_openings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  position_id uuid not null references public.job_positions(id),
  opening_number text not null,
  status text not null default 'draft' check (status in ('draft','published','paused','closed','filled')),
  published_at timestamptz,
  closes_at timestamptz,
  public_slug text,
  public_token text default gen_random_uuid()::text,
  custom_questions jsonb default '[]'::jsonb,
  applicant_count integer default 0,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, opening_number)
);

create table public.applicants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  opening_id uuid not null references public.job_openings(id),
  full_name text not null,
  email text not null,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  cover_letter text,
  resume_url text,
  custom_answers jsonb default '{}'::jsonb,
  stage text not null default 'applied'
    check (stage in ('applied','screening','documents','exams','interview','offer','hired','rejected','withdrawn')),
  documents_uploaded jsonb default '[]'::jsonb,
  documents_verified boolean default false,
  exam_scores jsonb default '{}'::jsonb,
  interview_score numeric,
  interview_summary text,
  interview_recommendation text check (interview_recommendation in ('apt','apt_with_reservations','not_apt')),
  decision text check (decision in ('pending','approved','rejected','withdrawn')),
  decision_date timestamptz,
  decision_by uuid references public.profiles(id),
  decision_notes text,
  converted_profile_id uuid references public.profiles(id),
  converted_at timestamptz,
  source text default 'portal',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, opening_id, email)
);

create index idx_job_positions_tenant on public.job_positions(tenant_id);
create index idx_job_openings_tenant on public.job_openings(tenant_id, status);
create index idx_job_openings_token on public.job_openings(public_token);
create index idx_applicants_opening on public.applicants(tenant_id, opening_id);
create index idx_applicants_stage on public.applicants(tenant_id, stage);
create index idx_applicants_email on public.applicants(tenant_id, email);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS — staff tenant-scoped; CRUD solo CEO+. Público SOLO vía RPCs SECURITY DEFINER
-- (get_public_opening / apply_to_opening / upload_applicant_document) — sin policy pública
-- amplia para no filtrar columnas internas (notes, applicant_count, tokens...).
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.job_positions enable row level security;
alter table public.job_openings enable row level security;
alter table public.applicants enable row level security;

create policy jp_sel on public.job_positions for select using (tenant_id = public.current_tenant());
create policy jp_wr on public.job_positions for all
  using (tenant_id = public.current_tenant() and public.is_ceo_or_above())
  with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());

create policy jo_sel on public.job_openings for select using (tenant_id = public.current_tenant());
create policy jo_wr on public.job_openings for all
  using (tenant_id = public.current_tenant() and public.is_ceo_or_above())
  with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());

-- candidatos = PII sensible → solo CEO+ del tenant ve/gestiona (staff no-owner no ve el pipeline).
create policy ap_sel on public.applicants for select
  using (tenant_id = public.current_tenant() and public.is_ceo_or_above());
create policy ap_wr on public.applicants for all
  using (tenant_id = public.current_tenant() and public.is_ceo_or_above())
  with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());

-- ═══════════════════════════════════════════════════════════════════════════
-- HELPERS
-- ═══════════════════════════════════════════════════════════════════════════
-- slug: quita acentos españoles (unaccent no está instalado), a-z0-9 + guiones, + sufijo aleatorio.
create or replace function public._recruit_slug(p_title text)
returns text language sql stable as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(p_title,'vacante'), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')),
    '[^a-z0-9]+', '-', 'g')) || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
$$;

-- número correlativo VAC-001 por tenant (patrón CC/JE).
create or replace function public._recruit_next_opening_number(p_tenant uuid)
returns text language sql stable as $$
  select 'VAC-' || lpad((coalesce(
    (select max(nullif(regexp_replace(opening_number, '\D', '', 'g'), '')::int)
     from public.job_openings where tenant_id = p_tenant), 0) + 1)::text, 3, '0');
$$;

-- cierra la vacante si ya se alcanzó el headcount del puesto.
create or replace function public._recruit_maybe_fill(p_opening uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare _pos uuid; _cap int; _hired int; _tenant uuid;
begin
  select position_id, tenant_id into _pos, _tenant from public.job_openings where id = p_opening;
  select coalesce(positions_count, 1) into _cap from public.job_positions where id = _pos;
  select count(*) into _hired from public.applicants where opening_id = p_opening and stage = 'hired';
  if _hired >= _cap then
    update public.job_openings set status = 'filled', updated_at = now() where id = p_opening and status <> 'closed';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPCs — PUESTOS
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.create_job_position(p_data jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _id uuid;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  insert into public.job_positions(
    tenant_id, title, department, description, responsibilities, employment_type, schedule, location,
    is_remote, salary_type, salary_min, salary_max, currency, requirements, required_documents,
    required_certifications, skills, min_experience_months, education_level,
    required_training_ids, required_exam_ids, positions_count, created_by)
  values (public.current_tenant(), p_data->>'title', p_data->>'department', p_data->>'description',
    p_data->>'responsibilities', coalesce(p_data->>'employment_type','full_time'), p_data->>'schedule',
    p_data->>'location', coalesce((p_data->>'is_remote')::boolean, false),
    coalesce(p_data->>'salary_type','hourly'), (p_data->>'salary_min')::numeric, (p_data->>'salary_max')::numeric,
    coalesce(p_data->>'currency','USD'), coalesce(p_data->'requirements','[]'::jsonb),
    coalesce(p_data->'required_documents','[]'::jsonb), coalesce(p_data->'required_certifications','[]'::jsonb),
    coalesce(p_data->'skills','[]'::jsonb), coalesce((p_data->>'min_experience_months')::int, 0),
    p_data->>'education_level',
    coalesce((select array_agg(x::uuid) from jsonb_array_elements_text(p_data->'required_training_ids') x), '{}'),
    coalesce((select array_agg(x::uuid) from jsonb_array_elements_text(p_data->'required_exam_ids') x), '{}'),
    coalesce((p_data->>'positions_count')::int, 1), auth.uid())
  returning id into _id;
  return _id;
end $$;

create or replace function public.update_job_position(p_id uuid, p_data jsonb)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  update public.job_positions set
    title = coalesce(p_data->>'title', title),
    department = coalesce(p_data->>'department', department),
    description = coalesce(p_data->>'description', description),
    responsibilities = coalesce(p_data->>'responsibilities', responsibilities),
    employment_type = coalesce(p_data->>'employment_type', employment_type),
    schedule = coalesce(p_data->>'schedule', schedule),
    location = coalesce(p_data->>'location', location),
    is_remote = coalesce((p_data->>'is_remote')::boolean, is_remote),
    salary_type = coalesce(p_data->>'salary_type', salary_type),
    salary_min = coalesce((p_data->>'salary_min')::numeric, salary_min),
    salary_max = coalesce((p_data->>'salary_max')::numeric, salary_max),
    currency = coalesce(p_data->>'currency', currency),
    requirements = coalesce(p_data->'requirements', requirements),
    required_documents = coalesce(p_data->'required_documents', required_documents),
    required_certifications = coalesce(p_data->'required_certifications', required_certifications),
    skills = coalesce(p_data->'skills', skills),
    min_experience_months = coalesce((p_data->>'min_experience_months')::int, min_experience_months),
    education_level = coalesce(p_data->>'education_level', education_level),
    positions_count = coalesce((p_data->>'positions_count')::int, positions_count),
    is_active = coalesce((p_data->>'is_active')::boolean, is_active),
    updated_at = now()
  where id = p_id and tenant_id = public.current_tenant();
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPCs — VACANTES
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.create_job_opening(
  p_position_id uuid, p_closes_at timestamptz default null,
  p_custom_questions jsonb default '[]'::jsonb, p_notes text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _id uuid; _tenant uuid; _title text;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  _tenant := public.current_tenant();
  select title into _title from public.job_positions where id = p_position_id and tenant_id = _tenant;
  if _title is null then raise exception 'Puesto no encontrado'; end if;
  insert into public.job_openings(tenant_id, position_id, opening_number, status, closes_at,
    public_slug, custom_questions, notes, created_by)
  values (_tenant, p_position_id, public._recruit_next_opening_number(_tenant), 'draft', p_closes_at,
    public._recruit_slug(_title), coalesce(p_custom_questions,'[]'::jsonb), p_notes, auth.uid())
  returning id into _id;
  return _id;
end $$;

create or replace function public.publish_job_opening(p_opening_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  update public.job_openings set status = 'published', published_at = coalesce(published_at, now()), updated_at = now()
  where id = p_opening_id and tenant_id = public.current_tenant() and status in ('draft','paused');
  if not found then raise exception 'Vacante no publicable (revisa el estado)'; end if;
end $$;

create or replace function public.set_job_opening_status(p_opening_id uuid, p_status text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  if p_status not in ('paused','closed') then raise exception 'Estado inválido'; end if;
  update public.job_openings set status = p_status, updated_at = now()
  where id = p_opening_id and tenant_id = public.current_tenant();
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPCs — PÚBLICAS (candidato sin cuenta): get_public_opening / apply / upload_document
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.get_public_opening(p_token text)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'opening_id', o.id, 'title', p.title, 'department', p.department, 'description', p.description,
    'responsibilities', p.responsibilities, 'employment_type', p.employment_type, 'schedule', p.schedule,
    'location', p.location, 'is_remote', p.is_remote, 'salary_type', p.salary_type,
    'salary_min', p.salary_min, 'salary_max', p.salary_max, 'currency', p.currency,
    'requirements', p.requirements, 'skills', p.skills, 'custom_questions', o.custom_questions,
    'closes_at', o.closes_at)
  from public.job_openings o join public.job_positions p on p.id = o.position_id
  where o.public_token = p_token and o.status = 'published' and (o.closes_at is null or o.closes_at > now());
$$;

create or replace function public.apply_to_opening(
  p_opening_id uuid, p_full_name text, p_email text, p_phone text default null,
  p_address text default null, p_city text default null, p_state text default null,
  p_zip_code text default null, p_cover_letter text default null, p_custom_answers jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _id uuid; _tenant uuid; _status text; _closes timestamptz;
begin
  select tenant_id, status, closes_at into _tenant, _status, _closes
    from public.job_openings where id = p_opening_id;
  if _tenant is null then raise exception 'Vacante no encontrada'; end if;
  if _status <> 'published' then raise exception 'La vacante no está abierta'; end if;
  if _closes is not null and _closes <= now() then raise exception 'La vacante ya cerró'; end if;
  if trim(coalesce(p_full_name,'')) = '' or trim(coalesce(p_email,'')) = '' then
    raise exception 'Nombre y email son obligatorios'; end if;
  if exists (select 1 from public.applicants where opening_id = p_opening_id and lower(email) = lower(p_email)) then
    raise exception 'Ya aplicaste a esta vacante con este email'; end if;
  insert into public.applicants(tenant_id, opening_id, full_name, email, phone, address, city, state,
    zip_code, cover_letter, custom_answers, stage, source)
  values (_tenant, p_opening_id, trim(p_full_name), lower(trim(p_email)), p_phone, p_address, p_city,
    p_state, p_zip_code, p_cover_letter, coalesce(p_custom_answers,'{}'::jsonb), 'applied', 'portal')
  returning id into _id;
  return _id;
end $$;

create or replace function public.upload_applicant_document(
  p_applicant_id uuid, p_document_name text, p_document_url text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not exists (select 1 from public.applicants where id = p_applicant_id) then
    raise exception 'Candidato no encontrado'; end if;
  update public.applicants set documents_uploaded = coalesce(documents_uploaded,'[]'::jsonb) ||
    jsonb_build_object('name', p_document_name, 'url', p_document_url,
      'uploaded_at', now(), 'verified', false), updated_at = now()
  where id = p_applicant_id;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPCs — PIPELINE (staff)
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.get_applicant_pipeline(p_opening_id uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_object_agg(stage, arr), '{}'::jsonb) from (
    select stage, jsonb_agg(jsonb_build_object(
      'id', id, 'full_name', full_name, 'email', email, 'phone', phone, 'stage', stage,
      'documents_verified', documents_verified, 'interview_score', interview_score,
      'interview_recommendation', interview_recommendation, 'applied_at', created_at)
      order by created_at) as arr
    from public.applicants
    where opening_id = p_opening_id and tenant_id = public.current_tenant()
      and public.is_ceo_or_above()
    group by stage) s;
$$;

-- transición de stage: solo hacia adelante (o a rejected/withdrawn); no desde estados terminales.
create or replace function public.advance_applicant(p_applicant_id uuid, p_to_stage text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _cur text; _order text[] := array['applied','screening','documents','exams','interview','offer','hired'];
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select stage into _cur from public.applicants where id = p_applicant_id and tenant_id = public.current_tenant();
  if _cur is null then raise exception 'Candidato no encontrado'; end if;
  if _cur in ('hired','rejected','withdrawn') then raise exception 'El candidato está en un estado final'; end if;
  if p_to_stage = 'hired' then return public.convert_applicant_to_employee(p_applicant_id, 'servicio'); end if;
  if p_to_stage not in ('rejected','withdrawn') then
    if array_position(_order, p_to_stage) is null then raise exception 'Stage inválido'; end if;
    if array_position(_order, p_to_stage) <= array_position(_order, _cur) then
      raise exception 'Solo se puede avanzar hacia adelante'; end if;
  end if;
  update public.applicants set stage = p_to_stage, updated_at = now() where id = p_applicant_id;
  return jsonb_build_object('status','advanced','stage',p_to_stage);
end $$;

create or replace function public.reject_applicant(p_applicant_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  update public.applicants set stage = 'rejected', decision = 'rejected', decision_by = auth.uid(),
    decision_date = now(), decision_notes = p_reason, updated_at = now()
  where id = p_applicant_id and tenant_id = public.current_tenant() and stage <> 'hired';
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- CONVERSIÓN candidato → empleado. profiles.id → auth.users(id), así que NO se puede crear
-- el profile a mano: se reutiliza el flujo de invitación real (allowed_emails + handle_new_user).
-- convert marca al candidato como hired y "prepara" la cuenta; si el profile ya existe lo enlaza
-- de una vez. El trigger _link_converted_applicant termina el enlace cuando la cuenta invitada
-- crea su profile (puebla employee_details desde los datos del candidato).
-- ═══════════════════════════════════════════════════════════════════════════
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
end $$;

create or replace function public.convert_applicant_to_employee(
  p_applicant_id uuid, p_role app_role default 'servicio')
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare a record; _pid uuid;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select * into a from public.applicants where id = p_applicant_id and tenant_id = public.current_tenant();
  if a.id is null then raise exception 'Candidato no encontrado'; end if;
  if a.converted_profile_id is not null then raise exception 'El candidato ya fue convertido'; end if;

  -- prepara la cuenta para el flujo de invitación estándar (handle_new_user usará estos datos).
  insert into public.allowed_emails(tenant_id, email, role, full_name)
  values (a.tenant_id, lower(a.email), p_role, a.full_name)
  on conflict (tenant_id, email) do update set role = excluded.role, full_name = excluded.full_name;

  update public.applicants set stage = 'hired', decision = 'approved', decision_by = auth.uid(),
    decision_date = now(), updated_at = now() where id = p_applicant_id;

  -- ¿ya existe un profile para este email? (la invitación ya corrió) → enlazar ahora.
  select id into _pid from public.profiles where tenant_id = a.tenant_id and lower(email) = lower(a.email) limit 1;
  if _pid is not null then
    perform public._attach_employee_from_applicant(_pid, p_applicant_id);
    insert into public.user_roles(tenant_id, user_id, role) values (a.tenant_id, _pid, p_role)
      on conflict (tenant_id, user_id, role) do nothing;
    perform public._recruit_maybe_fill(a.opening_id);
    return jsonb_build_object('status','linked','profile_id',_pid);
  end if;

  perform public._recruit_maybe_fill(a.opening_id);
  return jsonb_build_object('status','invite_pending','email',a.email,'profile_id',null);
end $$;

-- al crearse el profile de un invitado, si hay un candidato hired esperando → completar el enlace.
create or replace function public._link_converted_applicant()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _aid uuid;
begin
  select id into _aid from public.applicants
    where tenant_id = new.tenant_id and lower(email) = lower(new.email)
      and stage = 'hired' and converted_profile_id is null
    order by created_at desc limit 1;
  if _aid is not null then perform public._attach_employee_from_applicant(new.id, _aid); end if;
  return new;
end $$;

drop trigger if exists trg_link_converted_applicant on public.profiles;
create trigger trg_link_converted_applicant after insert on public.profiles
  for each row execute function public._link_converted_applicant();

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS de mantenimiento + notificación
-- ═══════════════════════════════════════════════════════════════════════════
create trigger trg_job_positions_updated before update on public.job_positions
  for each row execute function public.set_updated_at();
create trigger trg_job_openings_updated before update on public.job_openings
  for each row execute function public.set_updated_at();
create trigger trg_applicants_updated before update on public.applicants
  for each row execute function public.set_updated_at();

-- recuento denormalizado applicant_count.
create or replace function public._recount_opening_applicants()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _op uuid := coalesce(new.opening_id, old.opening_id);
begin
  update public.job_openings set applicant_count = (select count(*) from public.applicants where opening_id = _op)
  where id = _op;
  return null;
end $$;
create trigger trg_recount_applicants after insert or delete on public.applicants
  for each row execute function public._recount_opening_applicants();

-- notifica al CEO/superadmin al recibir una nueva aplicación.
create or replace function public._notify_new_applicant()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _ceo uuid; _title text;
begin
  select p.title into _title from public.job_openings o join public.job_positions p on p.id = o.position_id
    where o.id = new.opening_id;
  for _ceo in select user_id from public.user_roles where tenant_id = new.tenant_id and role in ('ceo','superadmin') loop
    begin
      perform public._notify_user(new.tenant_id, _ceo, 'new_applicant', 'Nueva aplicación',
        new.full_name || ' aplicó a ' || coalesce(_title, 'una vacante'), 'applicant', new.id);
    exception when others then null; end;
  end loop;
  return new;
end $$;
create trigger trg_notify_new_applicant after insert on public.applicants
  for each row execute function public._notify_new_applicant();

-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE — bucket privado para CV/documentos de candidatos (patrón income_evidence).
-- Ruta: {tenant_id}/{applicant_id}/{archivo}. Lectura/borrado = staff del tenant.
-- La subida del candidato anónimo se hará vía signed URL emitida por el frontend (RRHH-1A-2);
-- upload_applicant_document solo registra la URL en documents_uploaded.
-- ═══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public) values ('applicant-docs', 'applicant-docs', false)
  on conflict (id) do nothing;
create policy applicant_docs_select on storage.objects for select to authenticated
  using (bucket_id = 'applicant-docs' and (storage.foldername(name))[1] = public.current_tenant()::text);
create policy applicant_docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'applicant-docs' and (storage.foldername(name))[1] = public.current_tenant()::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- GRANTS — RPCs públicas accesibles por anon (candidato sin cuenta) + authenticated.
-- ═══════════════════════════════════════════════════════════════════════════
grant execute on function public.get_public_opening(text) to anon, authenticated;
grant execute on function public.apply_to_opening(uuid, text, text, text, text, text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.upload_applicant_document(uuid, text, text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED demo (tenant "Vital", CEO Vital) — 2 puestos + 1 vacante publicada + 3 candidatos.
-- Idempotente: solo si el tenant existe y aún no tiene puestos.
-- ═══════════════════════════════════════════════════════════════════════════
do $$
declare _t uuid := '9ffea055-7d2a-4fec-a61e-517d0ad79492';
        _ceo uuid := 'd4065008-85bf-42c4-81a9-6d04a404cf6b';
        _pos1 uuid; _op1 uuid;
begin
  if not exists (select 1 from public.tenants where id = _t) then return; end if;
  if exists (select 1 from public.job_positions where tenant_id = _t) then return; end if;

  insert into public.job_positions(tenant_id, title, department, description, employment_type,
    salary_type, salary_min, salary_max, requirements, required_certifications, skills, positions_count, created_by)
  values (_t, 'Terapeuta Físico', 'Clínica', 'Evaluación y tratamiento de pacientes en rehabilitación.',
    'full_time', 'hourly', 18, 25, '["Licencia de terapia física PR"]'::jsonb, '["CPR certificado"]'::jsonb,
    '["Rehabilitación","Terapia manual","Comunicación"]'::jsonb, 1, _ceo)
  returning id into _pos1;

  insert into public.job_positions(tenant_id, title, department, description, employment_type,
    salary_type, salary_min, salary_max, requirements, skills, positions_count, created_by)
  values (_t, 'Asistente de Terapia', 'Clínica', 'Apoyo al terapeuta en sesiones y logística.',
    'part_time', 'hourly', 12, 15, '["Disponibilidad fin de semana"]'::jsonb,
    '["Trabajo en equipo","Organización"]'::jsonb, 2, _ceo);

  insert into public.job_openings(tenant_id, position_id, opening_number, status, published_at,
    public_slug, custom_questions, created_by)
  values (_t, _pos1, 'VAC-001', 'published', now(), public._recruit_slug('Terapeuta Físico'),
    '["¿Por qué te interesa la terapia física?","¿Tienes transporte propio?"]'::jsonb, _ceo)
  returning id into _op1;

  insert into public.applicants(tenant_id, opening_id, full_name, email, phone, stage,
    documents_verified, interview_score, interview_recommendation) values
    (_t, _op1, 'Carlos Rivera', 'carlos.rivera@example.com', '787-555-0101', 'interview', true, 8.7, 'apt'),
    (_t, _op1, 'María Santos', 'maria.santos@example.com', '787-555-0102', 'documents', false, null, null),
    (_t, _op1, 'Pedro López', 'pedro.lopez@example.com', '787-555-0103', 'applied', false, null, null);
end $$;
