-- 20260704000007_sales.sql
-- BC sales: leads, marketing_budgets, marketing_expenses. tenant_id + RLS.
-- leads no usa ENUMs (status/temperature/lead_source son text libre → se conservan tal cual).

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  contact_name text not null, phone text not null, email text, address text, city text,
  service_requested text not null,
  quoted_price numeric(12,2) check (quoted_price is null or quoted_price >= 0),
  lead_source text not null, temperature text not null, status text not null default 'Nuevo',
  attended_by uuid not null references auth.users(id),
  call_date date not null default current_date, call_time time, follow_up_date date,
  notes text, lost_reason text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid
);

create table public.marketing_budgets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  month date not null, channel text not null,
  budgeted_amount numeric(12,2) not null check (budgeted_amount >= 0),
  notes text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, month, channel)
);

create table public.marketing_expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  budget_id uuid references public.marketing_budgets(id),
  channel text not null, expense_date date not null,
  amount numeric(12,2) not null check (amount > 0),
  description text not null, campaign_name text, receipt_url text, notes text,
  linked_expense_id uuid references public.expenses(id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid
);

alter table public.leads enable row level security;
alter table public.marketing_budgets enable row level security;
alter table public.marketing_expenses enable row level security;

create policy leads_tenant_select on public.leads
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy marketing_budgets_tenant_select on public.marketing_budgets
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy marketing_expenses_tenant_select on public.marketing_expenses
  for select to authenticated using ( tenant_id = public.current_tenant() );
-- Escritura = service_role. Policies por rol → Fase 3.
