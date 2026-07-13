-- Migración 153: checklist de "puntos destacados" editable por tenant en products/services/packages.
-- gallery_images jsonb YA existe en las 3 tablas (migr 127) → aquí solo se agrega highlights.
-- Los RPC de detalle (_public_get_landing_{product,service,package}) usan to_jsonb(row) → la nueva
-- columna aparece automáticamente en el payload sin tocar funciones. Shape: [{icon,text_es,text_en}].
alter table public.tenant_landing_products add column if not exists highlights jsonb not null default '[]'::jsonb;
alter table public.tenant_landing_services add column if not exists highlights jsonb not null default '[]'::jsonb;
alter table public.tenant_landing_packages add column if not exists highlights jsonb not null default '[]'::jsonb;
