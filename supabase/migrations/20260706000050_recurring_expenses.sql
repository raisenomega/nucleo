-- 20260706000050_recurring_expenses.sql
-- Gastos fijos recurrentes: plantilla de gastos que se repiten cada mes (renta, luz, agua, seguro...).
-- El estado "pagado este mes" se calcula cruzando con expenses (mismo category_id, mes actual).
-- RLS tenant-scoped. tenant_id con default current_tenant() para insert desde el cliente.

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  category_id uuid not null references public.categories(id),
  label text not null,
  budgeted_amount numeric not null default 0,
  frequency text not null default 'monthly' check (frequency in ('monthly','quarterly','annual')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, category_id)
);
alter table public.recurring_expenses enable row level security;
create policy recurring_expenses_all on public.recurring_expenses
  for all to authenticated using (tenant_id = public.current_tenant()) with check (tenant_id = public.current_tenant());
