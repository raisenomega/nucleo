-- payroll-external-workers — hasta ahora payroll.employee_id (NOT NULL, FK a profiles) obligaba a que todo pago
-- fuera a un usuario del sistema. Los tipos "externos" (helper/speaker/consultant/technician/freelancer/contractor)
-- necesitan un registro reutilizable de personas SIN cuenta. Se crea payroll_workers (registro por tenant) y se
-- permite que payroll referencie a un externo: employee_id pasa a nullable y un CHECK exige EXACTAMENTE uno de
-- (employee_id, external_worker_id). No cambia el motor fiscal: worker_type sigue gobernando calculate_payroll_deductions.

create table if not exists public.payroll_workers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant() references public.tenants(id) on delete cascade,
  full_name text not null,
  worker_type text not null default 'contractor'
    check (worker_type in ('contractor','helper','speaker','consultant','technician','freelancer')),
  tax_id text,
  contact text,
  notes text,
  active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payroll_workers_tenant on public.payroll_workers(tenant_id, active);

alter table public.payroll_workers enable row level security;
create policy payroll_workers_select on public.payroll_workers for select
  using (tenant_id = current_tenant() and public.can_access_module('payroll','view'));
create policy payroll_workers_insert on public.payroll_workers for insert
  with check (tenant_id = current_tenant() and public.can_access_module('payroll','create'));
create policy payroll_workers_update on public.payroll_workers for update
  using (tenant_id = current_tenant() and public.can_access_module('payroll','edit'))
  with check (tenant_id = current_tenant() and public.can_access_module('payroll','edit'));
create policy payroll_workers_delete on public.payroll_workers for delete
  using (tenant_id = current_tenant() and public.can_access_module('payroll','delete'));

drop trigger if exists trg_payroll_workers_updated on public.payroll_workers;
create trigger trg_payroll_workers_updated before update on public.payroll_workers
  for each row execute function public.set_updated_at();

-- payroll: permitir beneficiario externo (exactamente uno de employee_id / external_worker_id)
alter table public.payroll add column if not exists external_worker_id uuid
  references public.payroll_workers(id) on delete restrict;
alter table public.payroll alter column employee_id drop not null;
alter table public.payroll drop constraint if exists payroll_beneficiary_chk;
alter table public.payroll add constraint payroll_beneficiary_chk
  check (num_nonnulls(employee_id, external_worker_id) = 1);
