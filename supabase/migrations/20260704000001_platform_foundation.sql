-- 00001_platform_foundation.sql
-- current_tenant() + tabla tenants + seed del tenant fundador #1.

-- §2 ESQUEMA — función base de aislamiento (la usan todas las tablas de datos).
create or replace function public.current_tenant()
returns uuid language sql stable as $$
  select nullif(
    current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', ''
  )::uuid
$$;

-- §3 ESQUEMA — registro de tenants.
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  legal_name text not null,
  primary_domain text unique,
  status text not null default 'active'
    check (status in ('active','suspended','offboarding')),
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;

-- Cada tenant autenticado ve SOLO su propia fila.
create policy tenants_self_select on public.tenants
  for select to authenticated
  using ( id = public.current_tenant() );
-- Escritura (alta/baja/cambios) = solo raisen vía service_role (bypassa RLS).
-- Sin policy de escritura para authenticated → denegado por defecto.

-- Sin seed: la tabla nace vacía. Los tenants se dan de alta en Fase 6 (datos reales).
