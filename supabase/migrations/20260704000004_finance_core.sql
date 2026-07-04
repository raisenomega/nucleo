-- 20260704000004_finance_core.sql  (parte 1/2 de finance)
-- BC finance: income, expenses, extraordinary_payments. tenant_id + RLS + category_id.
-- ENUMs de negocio (income_category, expense_category, extraordinary_category, payment_method)
-- → category_id / payment_method_id REFERENCES public.categories(id).

create table public.income (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  category_id uuid not null references public.categories(id),
  payment_method_id uuid not null references public.categories(id),
  amount numeric(12,2) not null check (amount > 0),
  income_date date not null,
  client_reference text, order_number text, notes text,
  is_deposited boolean not null default false,
  deposit_date date,
  retention_amount numeric(12,2) not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_reason text, deleted_by uuid references auth.users(id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  category_id uuid not null references public.categories(id),
  payment_method_id uuid not null references public.categories(id),
  amount numeric(12,2) not null check (amount > 0),
  expense_date date not null,
  paid_by uuid references auth.users(id),
  receipt_url text, notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_reason text, deleted_by uuid references auth.users(id),
  linked_inventory_movement_id uuid   -- FK cross-BC → inventory_movements: se añade en migración de wiring
);

create table public.extraordinary_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  category_id uuid not null references public.categories(id),
  payment_method_id uuid not null references public.categories(id),
  amount numeric(12,2) not null check (amount > 0),
  payment_date date not null,
  justification text not null,
  receipt_url text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_reason text, deleted_by uuid references auth.users(id),
  constraint justification_min check (char_length(btrim(justification)) >= 20)
);

alter table public.income enable row level security;
alter table public.expenses enable row level security;
alter table public.extraordinary_payments enable row level security;

create policy income_tenant_select on public.income
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy expenses_tenant_select on public.expenses
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy extraordinary_tenant_select on public.extraordinary_payments
  for select to authenticated using ( tenant_id = public.current_tenant() );
-- Escritura = service_role. Policies por rol → Fase 3.
