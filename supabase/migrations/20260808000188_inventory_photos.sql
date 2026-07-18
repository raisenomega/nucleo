-- Fotos por artículo de inventario (hasta 3, rutas del bucket privado evidence). Aditivo.
alter table public.inventory_items
  add column if not exists photo_urls text[] default '{}';
comment on column public.inventory_items.photo_urls is 'Hasta 3 fotos del artículo, rutas de Storage (bucket evidence)';
