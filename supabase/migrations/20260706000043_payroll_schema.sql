-- 20260706000043_payroll_schema.sql
-- Nómina avanzada (Sub-slice A): reglas de deducción configurables + campos calculados en payroll
-- + clasificación de gastos (expense_class). Solo tablas/columnas; funciones y seed en 00044/00045/00046.

create table public.payroll_deduction_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  label text not null,
  applies_to text not null check (applies_to in ('employee','employer','contractor')),
  calc_type text not null check (calc_type in ('percentage','fixed_amount')),
  rate numeric not null default 0,
  base_source text not null check (base_source in ('gross_salary','gross_payroll','contract_payment','fixed')),
  wage_cap numeric,
  per_employee boolean not null default true,
  frequency text not null default 'per_pay_period' check (frequency in ('per_pay_period','monthly','quarterly','annual')),
  country_code text default 'PR',
  notes text, sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, label)
);
alter table public.payroll_deduction_rules enable row level security;
create policy payroll_deduction_rules_all on public.payroll_deduction_rules
  for all to authenticated using (tenant_id = public.current_tenant()) with check (tenant_id = public.current_tenant());

-- Nómina: campos para el cálculo avanzado (los viejos registros quedan en default; el RPC hace fallback a amount).
alter table public.payroll add column worker_type text not null default 'employee' check (worker_type in ('employee','contractor'));
alter table public.payroll add column gross_salary numeric not null default 0;
alter table public.payroll add column deductions_employee jsonb not null default '[]'::jsonb;
alter table public.payroll add column contributions_employer jsonb not null default '[]'::jsonb;
alter table public.payroll add column net_salary numeric not null default 0;
alter table public.payroll add column total_employer_cost numeric not null default 0;

-- Clasificación de gastos (solo aplica a kind='expense'; null para el resto).
alter table public.categories add column expense_class text check (expense_class in ('fixed','variable','debt','one_time'));
