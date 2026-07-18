-- GPS real (browser geolocation): reconcilia asset_gps_logs (+custody_log_id/+accuracy),
-- default de proveedor, coords de parada, y RPC batch para insertar puntos en lote. Aditivo.

alter table public.tenant_assets alter column gps_provider set default 'browser_geolocation';

alter table public.asset_gps_logs
  add column if not exists custody_log_id uuid references public.asset_custody_log(id) on delete set null,
  add column if not exists accuracy numeric(6,1);
create index if not exists idx_gps_logs_custody on public.asset_gps_logs(custody_log_id, recorded_at);

-- Coordenadas capturadas del dispositivo al completar cada parada (verificación real sin geocoding).
alter table public.route_stops
  add column if not exists lat numeric(10,7),
  add column if not exists lng numeric(10,7);

-- Inserta múltiples coordenadas en una sola llamada (flush cada 30s con los puntos acumulados).
create or replace function public.batch_insert_gps_logs(p_logs jsonb)
  returns integer language plpgsql security definer set search_path to 'public' as $$
declare v_count integer;
begin
  insert into public.asset_gps_logs (tenant_id, asset_id, custody_log_id, latitude, longitude, speed, heading, accuracy, recorded_at)
  select current_tenant(), (e->>'asset_id')::uuid, nullif(e->>'custody_log_id','')::uuid,
         (e->>'latitude')::numeric, (e->>'longitude')::numeric,
         nullif(e->>'speed','')::numeric, nullif(e->>'heading','')::numeric, nullif(e->>'accuracy','')::numeric,
         coalesce(nullif(e->>'recorded_at','')::timestamptz, now())
  from jsonb_array_elements(p_logs) e
  where (e->>'asset_id')::uuid in (select id from public.tenant_assets where tenant_id = current_tenant());
  get diagnostics v_count = row_count;
  return v_count;
end; $$;
grant execute on function public.batch_insert_gps_logs(jsonb) to authenticated;
comment on function public.batch_insert_gps_logs is 'Inserta puntos GPS en lote (browser watchPosition). Valida asset del tenant. Deuda saldada: reemplaza endpoint externo para tracking celular/tablet.';
