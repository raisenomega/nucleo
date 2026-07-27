-- 20260808000302_training_media.sql
-- RRHH-MEDIA — Biblioteca de capacitación: recursos (documento/video/link/imagen/presentación) por curso + general.
-- Video provider-agnóstico: se guarda la URL; un helper detecta el provider (YouTube hoy, Bunny mañana).
-- Archivos → bucket privado 'training-media' (path {tenant}/resources/{resource_id}/{file}); el cliente firma al leer.
-- NOTA: writes gateados por can_access_module('training','edit'/'create') — consistente con el módulo (ceo/coo),
--       no is_ceo_or_above() (que excluiría COOs que ya gestionan capacitación).

create table if not exists public.training_resources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id) on delete cascade,
  title text not null,
  description text,
  resource_type text not null check (resource_type in ('document','video','link','image','presentation')),
  file_url text, file_name text, file_size integer, file_mime text,
  video_url text,
  video_provider text check (video_provider in ('youtube','vimeo','bunny','other') or video_provider is null),
  external_url text,
  category text,
  tags jsonb not null default '[]',
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.course_resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  resource_id uuid not null references public.training_resources(id) on delete cascade,
  sort_order integer not null default 0,
  is_required boolean not null default false,
  unique (course_id, resource_id)
);
create index if not exists idx_tres_tenant on public.training_resources(tenant_id, resource_type);
create index if not exists idx_cres_course on public.course_resources(course_id);

alter table public.training_resources enable row level security;
alter table public.course_resources enable row level security;

drop policy if exists tres_sel on public.training_resources;
create policy tres_sel on public.training_resources for select to authenticated
  using (tenant_id = public.current_tenant() and (is_public or public.can_access_module('training','edit')));
drop policy if exists tres_wr on public.training_resources;
create policy tres_wr on public.training_resources for all to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('training','edit'))
  with check (tenant_id = public.current_tenant() and public.can_access_module('training','create'));
drop policy if exists cres_sel on public.course_resources;
create policy cres_sel on public.course_resources for select to authenticated
  using (exists (select 1 from public.training_courses c where c.id = course_id and c.tenant_id = public.current_tenant()));
drop policy if exists cres_wr on public.course_resources;
create policy cres_wr on public.course_resources for all to authenticated
  using (exists (select 1 from public.training_courses c where c.id = course_id and c.tenant_id = public.current_tenant() and public.can_access_module('training','edit')))
  with check (exists (select 1 from public.training_courses c where c.id = course_id and c.tenant_id = public.current_tenant() and public.can_access_module('training','edit')));

drop trigger if exists trg_updated_at on public.training_resources;
create trigger trg_updated_at before update on public.training_resources for each row execute function public.set_updated_at();

-- Bucket privado (50MB). Lectura tenant-scoped (empleados ven materiales); escritura solo staff (coo+).
insert into storage.buckets (id, name, public, file_size_limit) values ('training-media','training-media',false,52428800)
  on conflict (id) do update set file_size_limit = 52428800;
drop policy if exists training_media_sel on storage.objects;
create policy training_media_sel on storage.objects for select to authenticated
  using (bucket_id = 'training-media' and (storage.foldername(name))[1] = public.current_tenant()::text);
drop policy if exists training_media_wr on storage.objects;
create policy training_media_wr on storage.objects for all to authenticated
  using (bucket_id = 'training-media' and (storage.foldername(name))[1] = public.current_tenant()::text and public.is_coo_or_above())
  with check (bucket_id = 'training-media' and (storage.foldername(name))[1] = public.current_tenant()::text and public.is_coo_or_above());

-- Helper: detecta el provider desde la URL (YouTube/Vimeo/Bunny/other). Espejo del helper del frontend.
create or replace function public._detect_video_provider(p_url text) returns text language sql immutable as $$
  select case
    when p_url ~* 'youtube\.com|youtu\.be' then 'youtube'
    when p_url ~* 'vimeo\.com' then 'vimeo'
    when p_url ~* 'bunnycdn|mediadelivery\.net' then 'bunny'
    else 'other' end $$;

create or replace function public.create_training_resource(p_data jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare _id uuid; _type text := p_data->>'resource_type'; _vurl text := nullif(p_data->>'video_url','');
begin
  if not public.can_access_module('training','create') then raise exception 'forbidden'; end if;
  insert into public.training_resources (title, description, resource_type, file_url, file_name, file_size, file_mime,
    video_url, video_provider, external_url, category, tags, is_public, sort_order)
  values (p_data->>'title', nullif(p_data->>'description',''), _type,
    nullif(p_data->>'file_url',''), nullif(p_data->>'file_name',''), (p_data->>'file_size')::int, nullif(p_data->>'file_mime',''),
    _vurl, case when _type='video' and _vurl is not null then public._detect_video_provider(_vurl) end,
    nullif(p_data->>'external_url',''), nullif(p_data->>'category',''),
    coalesce(p_data->'tags','[]'::jsonb), coalesce((p_data->>'is_public')::boolean, true), coalesce((p_data->>'sort_order')::int,0))
  returning id into _id;
  return _id;
end $$;

create or replace function public.update_training_resource(p_id uuid, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare _vurl text := nullif(p_data->>'video_url','');
begin
  if not public.can_access_module('training','edit') then raise exception 'forbidden'; end if;
  update public.training_resources set
    title = coalesce(nullif(p_data->>'title',''), title),
    description = nullif(p_data->>'description',''),
    category = nullif(p_data->>'category',''),
    tags = coalesce(p_data->'tags', tags),
    is_public = coalesce((p_data->>'is_public')::boolean, is_public),
    video_url = coalesce(_vurl, video_url),
    video_provider = case when _vurl is not null then public._detect_video_provider(_vurl) else video_provider end,
    external_url = coalesce(nullif(p_data->>'external_url',''), external_url)
  where id = p_id and tenant_id = public.current_tenant();
end $$;

create or replace function public.delete_training_resource(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_access_module('training','edit') then raise exception 'forbidden'; end if;
  delete from public.training_resources where id = p_id and tenant_id = public.current_tenant();
end $$;

create or replace function public.link_resource_to_course(p_course_id uuid, p_resource_id uuid, p_is_required boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_access_module('training','edit') then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.training_courses where id = p_course_id and tenant_id = public.current_tenant()) then
    raise exception 'course not found'; end if;
  insert into public.course_resources (course_id, resource_id, is_required,
    sort_order) values (p_course_id, p_resource_id, p_is_required,
    coalesce((select max(sort_order)+1 from public.course_resources where course_id = p_course_id),0))
  on conflict (course_id, resource_id) do update set is_required = excluded.is_required;
end $$;

create or replace function public.unlink_resource_from_course(p_course_id uuid, p_resource_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_access_module('training','edit') then raise exception 'forbidden'; end if;
  delete from public.course_resources where course_id = p_course_id and resource_id = p_resource_id;
end $$;

-- Recursos de un curso (empleado inscrito O staff). Devuelve el path en file_url; el cliente firma al leer.
create or replace function public.get_course_resources(p_course_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare _t uuid; _allowed boolean;
begin
  select tenant_id into _t from public.training_courses where id = p_course_id;
  if _t is null or _t <> public.current_tenant() then return '[]'::jsonb; end if;
  _allowed := public.can_access_module('training','view')
    or exists (select 1 from public.training_enrollments e where e.course_id = p_course_id and e.employee_id = auth.uid());
  if not _allowed then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(to_jsonb(r) || jsonb_build_object('is_required', cr.is_required, 'link_order', cr.sort_order) order by cr.sort_order, cr.id)
    from public.course_resources cr join public.training_resources r on r.id = cr.resource_id
    where cr.course_id = p_course_id), '[]'::jsonb);
end $$;

-- Biblioteca general: staff = todo; empleado = solo is_public.
create or replace function public.get_resource_library(p_tenant_id uuid default public.current_tenant()) returns jsonb
language plpgsql security definer set search_path = public as $$
declare _staff boolean := public.can_access_module('training','edit');
begin
  if p_tenant_id <> public.current_tenant() then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(to_jsonb(r) order by r.sort_order, r.created_at desc)
    from public.training_resources r where r.tenant_id = p_tenant_id and (_staff or r.is_public)), '[]'::jsonb);
end $$;

grant execute on function public.create_training_resource(jsonb), public.update_training_resource(uuid, jsonb),
  public.delete_training_resource(uuid), public.link_resource_to_course(uuid, uuid, boolean),
  public.unlink_resource_from_course(uuid, uuid), public.get_course_resources(uuid),
  public.get_resource_library(uuid) to authenticated;

-- Seed VitalMotion (9ffea055) — 5 recursos demo + vínculo al curso 'heroe'. Sin archivos reales (file_url simulado).
do $$
declare _t uuid := '9ffea055-7d2a-4fec-a61e-517d0ad79492';
  _by uuid := 'd4065008-85bf-42c4-81a9-6d04a404cf6b'; _course uuid := '3f7edf50-755f-47b5-a6f4-84eaa5070d4c';
  _r1 uuid; _r2 uuid; _r3 uuid;
begin
  if not exists (select 1 from public.training_resources where tenant_id = _t) then
    insert into public.training_resources (tenant_id, title, description, resource_type, file_url, file_name, file_size, file_mime, category, tags, created_by)
      values (_t, 'Manual de Protocolos VitalMotion', 'Procedimientos internos de terapia física', 'document',
        _t || '/resources/seed-manual/manual-protocolos.pdf', 'manual-protocolos.pdf', 2411520, 'application/pdf',
        'Protocolos', '["onboarding","obligatorio"]'::jsonb, _by) returning id into _r1;
    insert into public.training_resources (tenant_id, title, description, resource_type, video_url, video_provider, category, tags, created_by)
      values (_t, 'Introducción a la Terapia Física', 'Video de bienvenida', 'video',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'Formación', '["onboarding"]'::jsonb, _by) returning id into _r2;
    insert into public.training_resources (tenant_id, title, resource_type, file_url, file_name, file_size, file_mime, category, created_by)
      values (_t, 'Ergonomía en el Trabajo', 'presentation', _t || '/resources/seed-ergo/ergonomia.pptx', 'ergonomia.pptx',
        5138022, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'Seguridad', _by) returning id into _r3;
    insert into public.training_resources (tenant_id, title, resource_type, external_url, category, created_by)
      values (_t, 'Guía OSHA de Seguridad Laboral', 'link', 'https://www.osha.gov/workers/spanish', 'Seguridad', _by);
    insert into public.training_resources (tenant_id, title, resource_type, video_url, video_provider, category, created_by)
      values (_t, 'Técnicas de Rehabilitación', 'video', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'youtube', 'Formación', _by);
    insert into public.course_resources (course_id, resource_id, is_required, sort_order) values
      (_course, _r1, true, 0), (_course, _r2, false, 1), (_course, _r3, false, 2);
  end if;
end $$;
