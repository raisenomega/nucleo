-- GPS-4 A · Geofencing: zonas que alertan cuando un vehículo entra/sale. Detección en cada GPS log (trigger).
create table public.geofences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, description text,
  fence_type text not null default 'circle' check (fence_type in ('circle','polygon')),
  center_lat numeric, center_lng numeric, radius_meters numeric,
  polygon_coords jsonb,
  trigger_on text not null default 'both' check (trigger_on in ('enter','exit','both')),
  alert_type text not null default 'notification' check (alert_type in ('notification','email','both')),
  applies_to_all_assets boolean not null default true,
  active boolean not null default true, color text default 'royalblue',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.geofence_assets (
  geofence_id uuid not null references public.geofences(id) on delete cascade,
  asset_id uuid not null references public.tenant_assets(id) on delete cascade,
  primary key (geofence_id, asset_id)
);
create table public.geofence_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  geofence_id uuid not null references public.geofences(id) on delete cascade,
  asset_id uuid not null references public.tenant_assets(id) on delete cascade,
  event_type text not null check (event_type in ('enter','exit')),
  latitude numeric not null, longitude numeric not null,
  recorded_at timestamptz not null default now(), notified boolean not null default false
);
create index idx_geofence_events_asset on public.geofence_events(asset_id, geofence_id, recorded_at desc);

alter table public.geofences enable row level security;
alter table public.geofence_assets enable row level security;
alter table public.geofence_events enable row level security;
create policy gf_select on public.geofences for select using (tenant_id = public.current_tenant());
create policy gf_write on public.geofences for all using (tenant_id = public.current_tenant() and public.can_access_module('assets','edit'))
  with check (tenant_id = public.current_tenant() and public.can_access_module('assets','edit'));
create policy gfa_all on public.geofence_assets for all
  using (exists (select 1 from public.geofences g where g.id = geofence_id and g.tenant_id = public.current_tenant()))
  with check (exists (select 1 from public.geofences g where g.id = geofence_id and g.tenant_id = public.current_tenant()));
create policy gfe_select on public.geofence_events for select using (tenant_id = public.current_tenant());

-- Distancia en metros (Haversine, suficiente para geofencing).
create or replace function public._haversine_meters(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
 returns numeric language sql immutable as $$
  select 6371000 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)));
$$;

-- Point-in-polygon (ray casting). p_poly = [{lat,lng}, ...].
create or replace function public._point_in_polygon(p_lat numeric, p_lng numeric, p_poly jsonb)
 returns boolean language plpgsql immutable as $$
declare _n int; _i int; _j int; _in boolean := false; _xi numeric; _yi numeric; _xj numeric; _yj numeric;
begin
  _n := jsonb_array_length(coalesce(p_poly, '[]'::jsonb));
  if _n < 3 then return false; end if;
  _j := _n - 1;
  for _i in 0 .. _n - 1 loop
    _xi := (p_poly->_i->>'lng')::numeric; _yi := (p_poly->_i->>'lat')::numeric;
    _xj := (p_poly->_j->>'lng')::numeric; _yj := (p_poly->_j->>'lat')::numeric;
    if ((_yi > p_lat) <> (_yj > p_lat)) and (p_lng < (_xj - _xi) * (p_lat - _yi) / nullif(_yj - _yi, 0) + _xi) then
      _in := not _in;
    end if;
    _j := _i;
  end loop;
  return _in;
end $$;

-- Detección: por cada geocerca activa que aplica al activo, compara dentro/fuera vs el último evento → enter/exit.
create or replace function public.check_geofence_violations(p_asset_id uuid, p_lat numeric, p_lng numeric)
 returns void language plpgsql security definer set search_path to 'public' as $$
declare _t uuid; _aname text; _g record; _inside boolean; _was boolean; _ev text; _uid uuid;
begin
  select tenant_id, name into _t, _aname from public.tenant_assets where id = p_asset_id;
  if _t is null then return; end if;
  for _g in select * from public.geofences gf where gf.tenant_id = _t and gf.active
    and (gf.applies_to_all_assets or exists (select 1 from public.geofence_assets ga where ga.geofence_id = gf.id and ga.asset_id = p_asset_id))
  loop
    if _g.fence_type = 'circle' then
      _inside := (_g.center_lat is not null and _g.radius_meters is not null
        and public._haversine_meters(_g.center_lat, _g.center_lng, p_lat, p_lng) <= _g.radius_meters);
    else
      _inside := public._point_in_polygon(p_lat, p_lng, _g.polygon_coords);
    end if;
    select (event_type = 'enter') into _was from public.geofence_events
      where geofence_id = _g.id and asset_id = p_asset_id order by recorded_at desc limit 1;
    _was := coalesce(_was, false);
    if _inside and not _was then _ev := 'enter';
    elsif not _inside and _was then _ev := 'exit';
    else continue; end if;
    insert into public.geofence_events(tenant_id, geofence_id, asset_id, event_type, latitude, longitude)
      values (_t, _g.id, p_asset_id, _ev, p_lat, p_lng);
    if _g.trigger_on = 'both' or _g.trigger_on = _ev then
      select ur.user_id into _uid from public.user_roles ur where ur.tenant_id = _t and ur.role in ('ceo','superadmin') order by ur.role limit 1;
      if _uid is not null then
        perform public._notify_user(_t, _uid, 'geofence_'||_ev,
          _aname||' '||(case _ev when 'enter' then 'entró a' else 'salió de' end)||' '||_g.name, 'Evento de geocerca', 'asset', p_asset_id);
      end if;
    end if;
  end loop;
end $$;

-- Trigger en cada GPS log (guard: solo si el tenant tiene geocercas activas).
create or replace function public._check_geofence_on_gps_log() returns trigger
 language plpgsql security definer set search_path to 'public' as $$
begin
  if exists (select 1 from public.geofences where tenant_id = NEW.tenant_id and active) then
    perform public.check_geofence_violations(NEW.asset_id, NEW.latitude, NEW.longitude);
  end if;
  return NEW;
end $$;
create trigger trg_check_geofence after insert on public.asset_gps_logs
  for each row execute function public._check_geofence_on_gps_log();
