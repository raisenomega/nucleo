-- 20260704000006_fieldops.sql
-- BC fieldops: inventory_items, inventory_movements, service_routes, route_stops. tenant_id + RLS.
-- movement_type se conserva como CHECK text (dirección, no categoría de negocio).
-- route_stops.payment_method (text libre en el legacy) → payment_method_id → categories (unificado).

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  stock numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  min_stock numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  movement_type text not null check (movement_type in ('entrada','salida')),
  quantity numeric(12,2) not null check (quantity > 0),
  unit_cost numeric(12,2), movement_date date not null, notes text,
  linked_expense_id uuid references public.expenses(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid references auth.users(id)
);

create table public.service_routes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  route_date date not null,
  assigned_to uuid not null references auth.users(id),
  status text not null default 'Planificada', notes text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid
);

create table public.route_stops (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  route_id uuid not null references public.service_routes(id) on delete cascade,
  stop_order integer not null,
  client_name text not null, address text not null, city text,
  service_type text not null, scheduled_time time not null,
  estimated_amount numeric(12,2) not null check (estimated_amount >= 0),
  actual_amount numeric(12,2) check (actual_amount is null or actual_amount >= 0),
  payment_method_id uuid references public.categories(id),
  status text not null default 'Pendiente', notes text, completed_at timestamptz,
  linked_income_id uuid references public.income(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.service_routes enable row level security;
alter table public.route_stops enable row level security;

create policy inventory_items_tenant_select on public.inventory_items
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy inventory_movements_tenant_select on public.inventory_movements
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy service_routes_tenant_select on public.service_routes
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy route_stops_tenant_select on public.route_stops
  for select to authenticated using ( tenant_id = public.current_tenant() );
-- Escritura = service_role. Policies por rol → Fase 3.
