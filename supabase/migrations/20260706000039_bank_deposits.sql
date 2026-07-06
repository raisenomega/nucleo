-- 20260706000039_bank_deposits.sql
-- Conciliación v2 (GAP 1): depósitos al banco por cuenta, con tipo + referencia (cheques) + evidencia.
-- RLS tenant-scoped (for all). tenant_id/created_by con default para insert desde el cliente.

create table public.bank_deposits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  bank_account_id uuid not null references public.bank_accounts(id),
  amount numeric(12,2) not null check (amount > 0),
  deposit_type text not null check (deposit_type in ('cash','check','transfer','other')),
  deposit_date date not null,
  reference_number text,
  notes text,
  evidence_urls jsonb not null default '[]'::jsonb,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.bank_deposits enable row level security;
create policy bank_deposits_tenant_all on public.bank_deposits
  for all to authenticated using (tenant_id = public.current_tenant()) with check (tenant_id = public.current_tenant());
