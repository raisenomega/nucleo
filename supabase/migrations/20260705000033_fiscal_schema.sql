-- 20260705000033_fiscal_schema.sql
-- Conciliación fiscal (Sub-slice A): kind 'tax_obligation' + bank_accounts + tax_obligation_rules.
-- Tablas configurables por tenant (el preset PR se siembra en 00034). RLS lectura + escritura tenant-scoped.

-- 1) categories: ampliar CHECK de kind con 'tax_obligation'.
do $$
declare _c text;
begin
  select conname into _c from pg_constraint
   where conrelid = 'public.categories'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%kind%';
  if _c is not null then execute format('alter table public.categories drop constraint %I', _c); end if;
end $$;
alter table public.categories add constraint categories_kind_check
  check (kind in ('income','expense','extraordinary','payment_method','lead_source','service_type','channel','tax_obligation'));

-- 2) Cuentas de banco (multi-cuenta por tenant).
create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  bank_name text not null,
  account_last4 text,
  account_type text not null default 'checking' check (account_type in ('checking','savings')),
  is_primary boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, bank_name)
);
alter table public.bank_accounts enable row level security;
create policy bank_accounts_tenant_all on public.bank_accounts
  for all to authenticated using (tenant_id = public.current_tenant()) with check (tenant_id = public.current_tenant());

-- 3) Reglas de obligación fiscal (una por category kind='tax_obligation').
create table public.tax_obligation_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  category_id uuid not null references public.categories(id),
  calc_type text not null check (calc_type in ('percentage','fixed_amount')),
  rate numeric not null default 0,
  base_source text not null check (base_source in ('gross_income','gross_payroll','contractor_payments','net_income','fixed')),
  wage_cap numeric,
  per_employee boolean not null default false,
  frequency text not null default 'monthly' check (frequency in ('monthly','quarterly','annual')),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, category_id)
);
alter table public.tax_obligation_rules enable row level security;
create policy tax_obligation_rules_tenant_all on public.tax_obligation_rules
  for all to authenticated using (tenant_id = public.current_tenant()) with check (tenant_id = public.current_tenant());

-- 4) bank_reconciliation: enlazar cada conciliación a una cuenta de banco.
alter table public.bank_reconciliation add column bank_account_id uuid references public.bank_accounts(id);
