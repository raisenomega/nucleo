-- assets-custody (Fase C) — categorías dinámicas de activo + estado in_use + bitácora de custodia (checkout/checkin).
-- categories.kind CHECK += asset_type/asset_condition; tenant_assets.status += in_use. RPCs atómicos de checkout/checkin.

alter table public.categories drop constraint if exists categories_kind_check;
alter table public.categories add constraint categories_kind_check
  check (kind = any (array['income','expense','extraordinary','payment_method','lead_source','service_type','channel','tax_obligation','support_category','asset_type','asset_condition']));

alter table public.tenant_assets drop constraint if exists tenant_assets_status_check;
alter table public.tenant_assets add constraint tenant_assets_status_check
  check (status in ('active','maintenance','retired','sold','lost','in_use'));

-- Sembrar categorías de tipo de activo para el tenant Zafacones (idempotente).
insert into public.categories (tenant_id, kind, label, sort)
select '61205cb9-1418-4bfa-a029-bbb44d4e4310', 'asset_type', l, s from (values
  ('Vehículo',10),('Equipo',20),('Herramienta',30),('Tecnología',40),('Mobiliario',50),('Propiedad',60),('Maquinaria',70)) v(l,s)
on conflict (tenant_id, kind, label) do nothing;
insert into public.categories (tenant_id, kind, label, sort)
select '61205cb9-1418-4bfa-a029-bbb44d4e4310', 'asset_condition', l, s from (values
  ('Nuevo',10),('Bueno',20),('Regular',30),('Malo',40),('Fuera de servicio',50)) v(l,s)
on conflict (tenant_id, kind, label) do nothing;

create table if not exists public.asset_custody_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant() references public.tenants(id) on delete cascade,
  asset_id uuid not null references public.tenant_assets(id) on delete cascade,
  employee_id uuid not null references public.profiles(id),
  custody_type text not null check (custody_type in ('checkout','checkin')),
  custody_at timestamptz default now(),
  odometer_reading numeric(10,1), fuel_level text check (fuel_level in ('empty','quarter','half','three_quarter','full')),
  fuel_type text, fuel_gallons numeric(5,2), gps_enabled boolean default false,
  route_summary text, cargo_description text, stops_count int, condition_notes text,
  evidence_urls text[] default '{}', notes text,
  created_by uuid default auth.uid(), created_at timestamptz not null default now()
);
create index if not exists idx_asset_custody_asset on public.asset_custody_log(asset_id, custody_at);
alter table public.asset_custody_log enable row level security;
create policy acl_select on public.asset_custody_log for select using (tenant_id = current_tenant());
create policy acl_insert on public.asset_custody_log for insert with check (tenant_id = current_tenant() and public.can_access_module('assets','edit'));
create policy acl_delete on public.asset_custody_log for delete using (tenant_id = current_tenant() and public.can_access_module('assets','delete'));

-- RPC checkout: registra salida + asigna el activo al empleado + status in_use.
create or replace function public.asset_checkout(p_asset_id uuid, p_employee_id uuid, p_data jsonb)
 returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _t uuid := current_tenant(); _id uuid;
begin
  if not public.can_access_module('assets','edit') then raise exception 'No autorizado'; end if;
  if not exists (select 1 from public.tenant_assets where id = p_asset_id and tenant_id = _t) then raise exception 'Activo no encontrado'; end if;
  insert into public.asset_custody_log(asset_id, employee_id, custody_type, odometer_reading, fuel_level, fuel_type, gps_enabled, notes, evidence_urls)
    values(p_asset_id, p_employee_id, 'checkout', (p_data->>'odometer')::numeric, nullif(p_data->>'fuel_level',''), nullif(p_data->>'fuel_type',''), coalesce((p_data->>'gps')::boolean, false), nullif(p_data->>'notes',''), coalesce(array(select jsonb_array_elements_text(p_data->'evidence')), '{}')) returning id into _id;
  update public.tenant_assets set assigned_to = p_employee_id, status = 'in_use', updated_at = now() where id = p_asset_id and tenant_id = _t;
  return _id;
end $$;

-- RPC checkin: registra devolución (empleado = asignado actual) + libera el activo + status active.
create or replace function public.asset_checkin(p_asset_id uuid, p_data jsonb)
 returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _t uuid := current_tenant(); _emp uuid; _id uuid;
begin
  if not public.can_access_module('assets','edit') then raise exception 'No autorizado'; end if;
  select assigned_to into _emp from public.tenant_assets where id = p_asset_id and tenant_id = _t;
  if _emp is null then raise exception 'La unidad no está asignada'; end if;
  insert into public.asset_custody_log(asset_id, employee_id, custody_type, odometer_reading, fuel_level, fuel_gallons, route_summary, stops_count, cargo_description, condition_notes, notes, evidence_urls)
    values(p_asset_id, _emp, 'checkin', (p_data->>'odometer')::numeric, nullif(p_data->>'fuel_level',''), (p_data->>'gallons')::numeric, nullif(p_data->>'route',''), (p_data->>'stops')::int, nullif(p_data->>'cargo',''), nullif(p_data->>'condition',''), nullif(p_data->>'notes',''), coalesce(array(select jsonb_array_elements_text(p_data->'evidence')), '{}')) returning id into _id;
  update public.tenant_assets set assigned_to = null, status = 'active', updated_at = now() where id = p_asset_id and tenant_id = _t;
  return _id;
end $$;
