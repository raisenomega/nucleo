-- 20260704000005_finance_ledger.sql  (parte 2/2 de finance)
-- BC finance: payroll, retention_deposits, bank_reconciliation, month_closures. tenant_id + RLS.
-- payroll_period se conserva como ENUM; payment_method → payment_method_id → categories.

create type public.payroll_period as enum ('Semana','Quincena','Mensual');

create table public.payroll (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  employee_id uuid not null references public.profiles(id),
  amount numeric(12,2) not null check (amount > 0),
  period public.payroll_period not null,
  payment_method_id uuid not null references public.categories(id),
  pay_date date not null, notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_reason text, deleted_by uuid references auth.users(id)
);

create table public.retention_deposits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  period_month int not null, period_year int not null,
  amount numeric(12,2) not null check (amount > 0),
  deposit_date date not null, notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.bank_reconciliation (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  period_month int not null check (period_month between 1 and 12),
  period_year int not null check (period_year between 2020 and 2100),
  bank_balance numeric(12,2) not null, cutoff_date date not null, notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid references auth.users(id),
  unique (tenant_id, period_year, period_month)
);

create table public.month_closures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  period_month int not null, period_year int not null,
  total_income numeric(12,2) not null, total_expenses numeric(12,2) not null,
  total_payroll numeric(12,2) not null, total_extraordinary numeric(12,2) not null,
  retention_required numeric(12,2) not null, retention_deposited numeric(12,2) not null,
  bank_balance numeric(12,2), net_balance numeric(12,2) not null, reconciliation_diff numeric(12,2),
  closed_by uuid not null references auth.users(id),
  closed_at timestamptz not null default now(),
  unique (tenant_id, period_year, period_month)
);

alter table public.payroll enable row level security;
alter table public.retention_deposits enable row level security;
alter table public.bank_reconciliation enable row level security;
alter table public.month_closures enable row level security;

create policy payroll_tenant_select on public.payroll
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy retention_deposits_tenant_select on public.retention_deposits
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy bank_reconciliation_tenant_select on public.bank_reconciliation
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy month_closures_tenant_select on public.month_closures
  for select to authenticated using ( tenant_id = public.current_tenant() );
-- Escritura = service_role. Policies por rol → Fase 3.
