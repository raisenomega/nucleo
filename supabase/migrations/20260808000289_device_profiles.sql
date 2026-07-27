-- GPS-4 B · MDM básico (perfil de dispositivo, no un MDM completo). Registra qué dispositivo usa cada empleado,
-- config de la app por dispositivo (intervalo GPS/buffer/wake lock/cámara) y estado (batería, última conexión).
create table public.device_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.profiles(id),
  device_name text not null,
  device_type text not null default 'tablet' check (device_type in ('tablet','phone','laptop','other')),
  platform text, model text, os_version text, app_version text,
  gps_interval_seconds integer not null default 30,
  offline_buffer_size integer not null default 10000,
  wake_lock_enabled boolean not null default true,
  camera_enabled boolean not null default true,
  last_seen_at timestamptz, last_battery_pct integer, last_ip text,
  enrolled_at timestamptz default now(), active boolean not null default true, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (tenant_id, employee_id)
);
alter table public.device_profiles enable row level security;
create policy dp_select on public.device_profiles for select using (tenant_id = public.current_tenant());
create policy dp_write on public.device_profiles for all
  using (tenant_id = public.current_tenant() and public.can_access_module('assets','edit'))
  with check (tenant_id = public.current_tenant() and public.can_access_module('assets','edit'));

-- La app reporta su estado al abrir → actualiza last_seen/batería/plataforma y devuelve la config a aplicar.
-- Cualquier empleado puede reportar su propio dispositivo (definer). Crea el perfil con defaults si no existe.
create or replace function public.report_device_status(p_battery_pct integer default null, p_platform text default null,
  p_app_version text default null, p_os_version text default null, p_model text default null)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _t uuid := current_tenant(); _uid uuid := auth.uid(); _d public.device_profiles;
begin
  if _uid is null then raise exception 'NO_SESSION'; end if;
  select * into _d from public.device_profiles where tenant_id = _t and employee_id = _uid;
  if not found then
    insert into public.device_profiles(tenant_id, employee_id, device_name, platform, model, os_version, app_version, last_seen_at, last_battery_pct)
      values (_t, _uid, coalesce((select full_name from public.profiles where id = _uid), 'Dispositivo'), p_platform, p_model, p_os_version, p_app_version, now(), p_battery_pct)
      returning * into _d;
  else
    update public.device_profiles set last_seen_at = now(), last_battery_pct = coalesce(p_battery_pct, last_battery_pct),
      platform = coalesce(p_platform, platform), model = coalesce(p_model, model),
      os_version = coalesce(p_os_version, os_version), app_version = coalesce(p_app_version, app_version), updated_at = now()
      where id = _d.id returning * into _d;
  end if;
  return jsonb_build_object('gps_interval_seconds', _d.gps_interval_seconds, 'offline_buffer_size', _d.offline_buffer_size,
    'wake_lock_enabled', _d.wake_lock_enabled, 'camera_enabled', _d.camera_enabled);
end $$;
