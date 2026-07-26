-- GPS-2 · Monitoreo en vivo de flota. Primera vez que NÚCLEO usa Supabase Realtime.
-- 1) Realtime para asset_gps_logs (RLS ya filtra por tenant → un supervisor solo ve su flota).
alter publication supabase_realtime add table public.asset_gps_logs;

-- 2) Feature flag premium por tenant (default false; el mapa de flota/Realtime solo con true).
alter table public.tenants add column if not exists gps_realtime_enabled boolean not null default false;

-- 3) Foto inicial de la flota: última posición por activo + info + custodia activa (status='in_use').
-- Sin param de tenant a propósito (fuerza current_tenant → un tenant no puede consultar otro).
create or replace function public.get_fleet_positions()
 returns table(asset_id uuid, asset_name text, assigned_to_name text, latitude numeric, longitude numeric,
   speed numeric, heading numeric, accuracy numeric, recorded_at timestamptz, status text, has_active_custody boolean)
 language plpgsql stable security definer set search_path to 'public' as $$
declare _t uuid := current_tenant();
begin
  if not public.can_access_module('assets','view') then raise exception 'NOT_AUTHORIZED'; end if;
  return query
    select a.id, a.name, p.full_name, g.latitude, g.longitude, g.speed, g.heading, g.accuracy, g.recorded_at,
      a.status, (a.status = 'in_use')
    from public.tenant_assets a
    left join public.profiles p on p.id = a.assigned_to
    left join lateral (
      select l.latitude, l.longitude, l.speed, l.heading, l.accuracy, l.recorded_at
      from public.asset_gps_logs l where l.asset_id = a.id order by l.recorded_at desc limit 1
    ) g on true
    where a.tenant_id = _t and a.gps_enabled = true and a.is_active = true;
end $$;

-- 4) Paradas de la ruta asignada al activo en una fecha (para superponer al track). route_stops usa client_name.
create or replace function public.get_route_stops_for_asset(p_asset_id uuid, p_date date default current_date)
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare _t uuid := current_tenant();
begin
  if not public.can_access_module('assets','view') then raise exception 'NOT_AUTHORIZED'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', rs.id, 'order', rs.stop_order, 'address', rs.address, 'lat', rs.lat, 'lng', rs.lng,
      'status', rs.status, 'completedAt', rs.completed_at, 'clientName', rs.client_name, 'serviceType', rs.service_type
    ) order by rs.stop_order)
    from public.route_stops rs
      join public.service_routes sr on sr.id = rs.route_id
    where sr.asset_id = p_asset_id and sr.route_date = p_date and sr.tenant_id = _t and rs.deleted_at is null
  ), '[]'::jsonb);
end $$;

-- 5) Toggle del flag (solo ceo/superadmin), espejo de set_gl_enabled.
create or replace function public.set_gps_realtime(p_enabled boolean)
 returns boolean language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  update public.tenants set gps_realtime_enabled = p_enabled where id = current_tenant();
  return p_enabled;
end $$;
