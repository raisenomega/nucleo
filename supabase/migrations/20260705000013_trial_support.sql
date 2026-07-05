-- 20260705000013_trial_support.sql
-- Slice #2 Trial: status 'trial' + expires_at en tenants; tabla de solicitudes de consulta.

-- 1) tenants: nuevo estado 'trial' + fecha de expiración (solo aplica si status='trial').
--    El CHECK original es anónimo (auto-nombrado por Postgres) → lo localizo y lo borro sin adivinar.
do $$
declare _c text;
begin
  select conname into _c from pg_constraint
   where conrelid = 'public.tenants'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%status%';
  if _c is not null then execute format('alter table public.tenants drop constraint %I', _c); end if;
end $$;

alter table public.tenants add constraint tenants_status_check
  check (status in ('trial','active','suspended','offboarding'));
alter table public.tenants add column expires_at timestamptz;

-- 2) consultation_requests: formulario "Agendar consulta" (trial expirado → lead para raisen).
create table public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  contact_name text not null,
  business_name text not null,
  business_type text not null,
  employee_count text,
  main_problem text not null,
  desired_start text,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending','contacted','converted','dismissed'))
);

alter table public.consultation_requests enable row level security;
-- Sin policy para authenticated: solo service_role (raisen) lee/escribe. Denegado por defecto.
