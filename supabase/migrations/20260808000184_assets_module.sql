-- assets-module (Fase A+B) — activos (equipos/vehículos/herramientas) + bitácora de mantenimiento.
-- RLS por módulo 'assets' (patrón inventory_items): select por tenant, mutaciones vía can_access_module('assets', …).

create table if not exists public.tenant_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant() references public.tenants(id) on delete cascade,
  name text not null,
  asset_type text not null default 'equipment' check (asset_type in ('vehicle','equipment','tool','furniture','technology','property','other')),
  category text, serial_number text, model text, brand text,
  purchase_date date, purchase_price numeric(12,2), current_value numeric(12,2),
  depreciation_method text default 'none' check (depreciation_method in ('straight_line','none')),
  depreciation_years int,
  warranty_expires date,
  condition text not null default 'good' check (condition in ('new','good','fair','poor','out_of_service')),
  status text not null default 'active' check (status in ('active','maintenance','retired','sold','lost')),
  assigned_to uuid references public.profiles(id) on delete set null,
  location text, insurance_policy text, insurance_expires date, notes text, image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_tenant_assets_tenant on public.tenant_assets(tenant_id, is_active, status);
alter table public.tenant_assets enable row level security;
create policy assets_select on public.tenant_assets for select using (tenant_id = current_tenant());
create policy assets_insert on public.tenant_assets for insert with check (tenant_id = current_tenant() and public.can_access_module('assets','create'));
create policy assets_update on public.tenant_assets for update using (tenant_id = current_tenant() and public.can_access_module('assets','edit')) with check (tenant_id = current_tenant() and public.can_access_module('assets','edit'));
create policy assets_delete on public.tenant_assets for delete using (tenant_id = current_tenant() and public.can_access_module('assets','delete'));
drop trigger if exists trg_tenant_assets_updated on public.tenant_assets;
create trigger trg_tenant_assets_updated before update on public.tenant_assets for each row execute function public.set_updated_at();

create table if not exists public.asset_maintenance_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant() references public.tenants(id) on delete cascade,
  asset_id uuid not null references public.tenant_assets(id) on delete cascade,
  maintenance_type text not null default 'preventive' check (maintenance_type in ('preventive','corrective','inspection')),
  description text, cost numeric(10,2) default 0, performed_by text, performed_at date default current_date, next_due date, notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists idx_asset_maintenance_asset on public.asset_maintenance_log(asset_id, performed_at);
alter table public.asset_maintenance_log enable row level security;
create policy aml_select on public.asset_maintenance_log for select using (tenant_id = current_tenant());
create policy aml_insert on public.asset_maintenance_log for insert with check (tenant_id = current_tenant() and public.can_access_module('assets','edit'));
create policy aml_update on public.asset_maintenance_log for update using (tenant_id = current_tenant() and public.can_access_module('assets','edit')) with check (tenant_id = current_tenant() and public.can_access_module('assets','edit'));
create policy aml_delete on public.asset_maintenance_log for delete using (tenant_id = current_tenant() and public.can_access_module('assets','delete'));
