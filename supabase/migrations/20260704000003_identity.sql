-- 20260704000003_identity.sql
-- BC identity: profiles + user_roles + allowed_emails, reescritas con tenant_id + RLS.
-- Origen: legacy zr-finanzas (read-only). app_role se conserva como ENUM (no es categoría de negocio).

create type public.app_role as enum ('superadmin','ceo','coo','operaciones','servicio');

-- profiles (1:1 con auth.users, ahora tenant-scoped)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  email text unique not null,
  full_name text not null,
  avatar_url text,
  position text,
  pin_hash text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_at timestamptz,
  approved_by uuid,
  module_permissions text[],
  password_changed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id, role)
);

create table public.allowed_emails (
  tenant_id uuid not null references public.tenants(id),
  email text not null,
  role public.app_role not null,
  full_name text not null,
  module_permissions text[] default null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, email)
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.allowed_emails enable row level security;

create policy profiles_tenant_select on public.profiles
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy user_roles_tenant_select on public.user_roles
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy allowed_emails_tenant_select on public.allowed_emails
  for select to authenticated using ( tenant_id = public.current_tenant() );
-- Escritura = service_role (onboarding/admin). Policies por rol → Fase 3.
