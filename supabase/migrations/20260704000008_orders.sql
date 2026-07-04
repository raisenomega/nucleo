-- 20260704000008_orders.sql  (parte ESTRUCTURAL; triggers del puente en migración aparte)
-- BC orders (NUEVO, no legacy): tenant_order_counters + next_order_number() + online_orders.
-- Reemplaza el contador en localStorage (bug crítico auditado) por contador atómico por tenant.

create table public.tenant_order_counters (
  tenant_id uuid primary key references public.tenants(id),
  next_val bigint not null default 0   -- setear al último número real del tenant (onboarding, Fase 6+)
);

create or replace function public.next_order_number(_tenant uuid)
returns text language plpgsql as $$
declare _n bigint; _prefix text;
begin
  update public.tenant_order_counters set next_val = next_val + 1
    where tenant_id = _tenant returning next_val - 1 into _n;
  select value->>0 from public.settings
    where tenant_id = _tenant and key = 'order_prefix' into _prefix;
  return '#' || coalesce(_prefix,'') || _n::text;   -- ej. '#<prefix>NNNN'
end $$;

create table public.online_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  order_number text not null,
  kind text not null,                    -- promo|service|shop|installation|evaluation|contact
  status text not null default 'Nueva',  -- Nueva|Contactada|Pagada|Cancelada
  contact jsonb not null,                -- {name, phone, email, address}
  main_line jsonb not null,              -- {label, detail, price}
  addons jsonb not null default '[]',
  total numeric(12,2) not null check (total >= 0),
  locale text not null default 'es',
  stripe_session_id text,
  linked_lead_id uuid references public.leads(id),
  linked_income_id uuid references public.income(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, order_number)
);

alter table public.tenant_order_counters enable row level security;
alter table public.online_orders enable row level security;

create policy order_counters_tenant_select on public.tenant_order_counters
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy online_orders_tenant_select on public.online_orders
  for select to authenticated using ( tenant_id = public.current_tenant() );
-- Escritura: submit-order (Edge, service_role) resuelve tenant por dominio + valida + rate-limit.
