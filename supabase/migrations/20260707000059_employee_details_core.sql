-- 20260707000059_employee_details_core.sql
-- Expediente del empleado (§3.1): datos personales + contacto emergencia + profesional.
-- Beneficios + salud se añaden por ALTER en 00060. RLS ceo+ (Opción B).
-- v1: SSN en texto plano (columna ssn, solo últimos 4 en la UI); pgcrypto diferido (§9).

create table public.employee_details (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  -- Personal
  middle_name text, last_name text, ssn text, date_of_birth date,
  gender text check (gender in ('male','female','unspecified')),
  marital_status text check (marital_status in ('single','married','divorced','widowed')),
  dependents int default 0,
  address_line1 text, address_line2 text, city text, state_province text, zip_code text,
  country text default 'PR', personal_phone text, alternate_phone text, personal_email text, photo_url text,
  -- Contacto de emergencia
  emergency_name text, emergency_relationship text, emergency_phone text, emergency_phone_alt text, emergency_address text,
  -- Profesional
  department text, hire_date date, termination_date date,
  contract_type text check (contract_type in ('indefinite','probationary','temporary','contractor')),
  probation_end_date date,
  flsa_classification text check (flsa_classification in ('exempt','non_exempt')),
  gross_salary numeric,
  pay_frequency text check (pay_frequency in ('weekly','biweekly','monthly')),
  risk_classification text check (risk_classification in ('low','medium','high')),
  supervisor_id uuid references public.profiles(id),
  employee_number text, professional_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, profile_id)
);
alter table public.employee_details enable row level security;
create policy employee_details_ceo on public.employee_details
  for all to authenticated
  using ( tenant_id = public.current_tenant() and public.is_ceo_or_above() )
  with check ( tenant_id = public.current_tenant() and public.is_ceo_or_above() );
