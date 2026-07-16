-- route-evidence — evidencia fotográfica ANTES/DESPUÉS por parada de ruta.
-- El empleado documenta cómo encontró el lugar (before) y cómo lo dejó (after); 3+3 fotos.
-- Suben inmediato a Storage (bucket evidence) y la ruta se persiste aquí vía UPDATE directo, así las
-- fotos sobreviven a cerrar la app / apagar el celular. "Completar" solo cambia el status (RPC existente).
-- route_stops.evidence_urls (jsonb genérico) queda intacto como legacy; este feature usa columnas separadas.

alter table public.route_stops
  add column if not exists evidence_before text[] default '{}',
  add column if not exists evidence_after  text[] default '{}';

comment on column public.route_stops.evidence_before is 'Rutas Storage de fotos al llegar (máx 3)';
comment on column public.route_stops.evidence_after  is 'Rutas Storage de fotos al terminar (máx 3)';
