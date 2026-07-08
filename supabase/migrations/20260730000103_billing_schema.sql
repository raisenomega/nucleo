-- 20260730000103_billing_schema.sql
-- MÓDULO FACTURACIÓN (1/3): invoices + billing_plans. items como snapshot jsonb, tax por-item.
-- RLS via can_access_module('billing',*) (ceo/coo por catch-all). invoice_number auto vía next_order_number.

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  invoice_number text,
  client_name text not null, phone text, email text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0, tax numeric(12,2) not null default 0, total numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue','cancelled')),
  due_date date, paid_at timestamptz, payment_method_id uuid references public.categories(id),
  linked_income_id uuid references public.income(id),
  linked_lead_id uuid references public.leads(id),
  linked_order_id uuid references public.online_orders(id),
  notes text, created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, invoice_number)
);
create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  client_name text not null, phone text, email text,
  amount numeric(12,2) not null, frequency text not null check (frequency in ('weekly','biweekly','monthly','quarterly','annual')),
  service_description text, next_billing_date date not null,
  status text not null default 'active' check (status in ('active','paused','cancelled')),
  stripe_subscription_id text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_invoices_status on public.invoices(tenant_id, status, created_at desc);
create index if not exists idx_plans_next on public.billing_plans(tenant_id, status, next_billing_date);

-- Nº de factura automático (reutiliza el contador atómico por tenant).
create or replace function public.set_invoice_number()
returns trigger language plpgsql set search_path = public as $$
begin
  if NEW.invoice_number is null then NEW.invoice_number := public.next_order_number(NEW.tenant_id); end if;
  return NEW;
end $$;
drop trigger if exists trg_invoice_number on public.invoices;
create trigger trg_invoice_number before insert on public.invoices for each row execute function public.set_invoice_number();

alter table public.invoices enable row level security;
alter table public.billing_plans enable row level security;
create policy inv_all on public.invoices for all to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('billing','view'))
  with check (tenant_id = public.current_tenant() and public.can_access_module('billing','create'));
create policy plan_all on public.billing_plans for all to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('billing','view'))
  with check (tenant_id = public.current_tenant() and public.can_access_module('billing','create'));

drop trigger if exists trg_updated_at on public.invoices;
create trigger trg_updated_at before update on public.invoices for each row execute function public.set_updated_at();
drop trigger if exists trg_updated_at on public.billing_plans;
create trigger trg_updated_at before update on public.billing_plans for each row execute function public.set_updated_at();
