-- assets-pdf-gps-routes — GPS preparado (columnas + tabla vacía) + vínculo vehículo↔ruta. Aditivo, no toca RPCs.

alter table public.tenant_assets
  add column if not exists gps_enabled boolean default false,
  add column if not exists gps_device_id text,
  add column if not exists gps_provider text;

-- Tabla preparada para trackers GPS físicos. Sin datos hasta conectar el dispositivo.
create table if not exists public.asset_gps_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant() references public.tenants(id) on delete cascade,
  asset_id uuid not null references public.tenant_assets(id) on delete cascade,
  latitude numeric(10,7), longitude numeric(10,7), speed numeric(5,1), heading numeric(5,1),
  recorded_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_gps_logs_asset_time on public.asset_gps_logs(asset_id, recorded_at desc);
alter table public.asset_gps_logs enable row level security;
create policy gps_logs_select on public.asset_gps_logs for select using (tenant_id = current_tenant());
create policy gps_logs_insert on public.asset_gps_logs for insert with check (tenant_id = current_tenant());
comment on table public.asset_gps_logs is 'Preparada para coordenadas de trackers GPS via API. Vacía hasta conectar dispositivo. DEUDA: endpoint POST /api/gps/track/{device_id} (Samsara/Geotab/genérico).';

-- Vincular vehículo/activo a una ruta.
alter table public.service_routes add column if not exists asset_id uuid references public.tenant_assets(id) on delete set null;
comment on column public.service_routes.asset_id is 'Vehículo/activo asignado a esta ruta';
