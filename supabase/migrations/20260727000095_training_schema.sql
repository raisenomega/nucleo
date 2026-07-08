-- 20260727000095_training_schema.sql
-- MÓDULO CAPACITACIÓN (1/2): catálogo de cursos + asignaciones (enrollments) por empleado.
-- RLS via can_access_module('training',*) (ceo/coo por catch-all). Estados con CHECK + updated_at.

create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  title text not null, description text, category text, hours numeric(6,1),
  required boolean not null default false, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  employee_id uuid not null references public.profiles(id),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed','expired')),
  due_date date, completed_at timestamptz, score numeric(5,2),
  assigned_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (employee_id, course_id)
);
create index if not exists idx_enroll_employee on public.training_enrollments(tenant_id, employee_id);

alter table public.training_courses enable row level security;
alter table public.training_enrollments enable row level security;

create policy course_sel on public.training_courses for select to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('training','view'));
create policy course_wr on public.training_courses for all to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('training','edit'))
  with check (tenant_id = public.current_tenant() and public.can_access_module('training','create'));
create policy enroll_sel on public.training_enrollments for select to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('training','view'));
create policy enroll_ins on public.training_enrollments for insert to authenticated
  with check (tenant_id = public.current_tenant() and public.can_access_module('training','create'));
create policy enroll_upd on public.training_enrollments for update to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('training','edit'));
create policy enroll_del on public.training_enrollments for delete to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('training','delete'));

drop trigger if exists trg_updated_at on public.training_courses;
create trigger trg_updated_at before update on public.training_courses for each row execute function public.set_updated_at();
drop trigger if exists trg_updated_at on public.training_enrollments;
create trigger trg_updated_at before update on public.training_enrollments for each row execute function public.set_updated_at();
