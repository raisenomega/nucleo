-- Migración 160: landing hero sections (secciones destacadas editables por item). Patrón reusable (Hydro-Jet hoy,
-- Modelo Comercial futuro). Columna landing_hero jsonb por item + RPC anon que resuelve las secciones activas del
-- tenant por hostname. Seed 1:1 legacy del Hydro-Jet (contenido de i18n legacy hydroJet.ts) en el service Zafacones.

alter table public.tenant_landing_services add column if not exists landing_hero jsonb;
alter table public.tenant_landing_products add column if not exists landing_hero jsonb;
alter table public.tenant_landing_packages add column if not exists landing_hero jsonb;
create index if not exists idx_svc_landing_hero on public.tenant_landing_services using gin (landing_hero) where landing_hero is not null;
create index if not exists idx_prod_landing_hero on public.tenant_landing_products using gin (landing_hero) where landing_hero is not null;
create index if not exists idx_pkg_landing_hero on public.tenant_landing_packages using gin (landing_hero) where landing_hero is not null;

-- RPC: secciones hero activas del tenant (product+service+package) + resolución del target del CTA secundario.
create or replace function public._public_landing_hero_sections(_hostname text)
returns jsonb language plpgsql stable security definer set search_path to 'public', 'extensions' as $fn$
declare _t uuid; _res jsonb;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return '[]'::jsonb; end if;
  with items as (
    select 'service' k, id, slug, name, price, landing_hero h, display_order d from public.tenant_landing_services where tenant_id=_t and is_active and landing_hero->>'is_enabled'='true'
    union all
    select 'product', id, slug, name, price, landing_hero, display_order from public.tenant_landing_products where tenant_id=_t and is_active and landing_hero->>'is_enabled'='true'
    union all
    select 'package', id, slug, name, price, landing_hero, display_order from public.tenant_landing_packages where tenant_id=_t and is_active and landing_hero->>'is_enabled'='true'
  )
  select coalesce(jsonb_agg(jsonb_build_object('kind',k,'id',id,'slug',slug,'name',name,'base_price',price,'hero',h,
    'secondary_target',(select jsonb_build_object('id',ts.id,'name',ts.name,'base_price',ts.price)
      from public.tenant_landing_services ts where ts.tenant_id=_t and ts.slug = h->>'cta_secondary_target_service_slug' limit 1)) order by d), '[]'::jsonb)
    into _res from items;
  return _res;
end $fn$;
grant execute on function public._public_landing_hero_sections(text) to anon, authenticated;

-- Seed Hydro-Jet (Zafacones, service slug 'hydro-jet') — contenido 1:1 legacy hydroJet.ts. image_url null → Roy sube.
update public.tenant_landing_services set landing_hero = jsonb_build_object(
  'is_enabled', true, 'position', 'after-hero', 'layout', 'split-image-right',
  'title_es', 'Hydro-Jetter de Remolque', 'title_en', 'Trailer-mounted Hydro-Jetter',
  'subtitle_es', 'Unidad de alto rendimiento con calentador de agua hasta 250°F y 5,500 PSI, con un flujo de agua elevado (5.8 GPM) para arrasar con bacterias, moho y sedimentos pesados.',
  'subtitle_en', 'High-performance unit with water heater up to 250°F and 5,500 PSI, with high water flow (5.8 GPM) to wipe out bacteria, mold and heavy sediment.',
  'description_es', 'Servicio adicional para superficies fuera de zafacones: aceras, paredes, terrazas, entradas y áreas comerciales que requieren agua caliente y alta presión para eliminar grasa, moho, hongos y bacterias.',
  'description_en', 'Add-on service for surfaces beyond bins: sidewalks, walls, terraces, driveways and commercial areas that need hot water and high pressure to remove grease, mold, mildew and bacteria.',
  'image_url', null,
  'features', jsonb_build_array(
    jsonb_build_object('icon','Flame','text_es','Hasta 250°F','text_en','Up to 250°F'),
    jsonb_build_object('icon','Gauge','text_es','5,500 PSI','text_en','5,500 PSI'),
    jsonb_build_object('icon','Droplets','text_es','5.8 GPM de flujo','text_en','5.8 GPM flow'),
    jsonb_build_object('icon','Truck','text_es','Remolque autónomo','text_en','Self-contained trailer')),
  'cta_primary_label_es', 'Solicitar Hydro-Jet', 'cta_primary_label_en', 'Request Hydro-Jet',
  'cta_secondary_label_es', 'Añadir a mi suscripción', 'cta_secondary_label_en', 'Add to my subscription',
  'cta_secondary_target_service_slug', 'suscripcion-soterrados')
  where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and slug = 'hydro-jet';
