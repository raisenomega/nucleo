-- LANDING-HOME-UX Rodaja A: títulos/subtítulos editables por sección del home (Servicios/Productos/Paquetes).
-- Nullable sin default → cuando NULL el frontend cae al i18n hardcoded (lpSection*). Fluyen al público vía
-- to_jsonb(tenant_landing_config) en _public_get_landing_home (home.hero.section_*) sin tocar el RPC.
alter table public.tenant_landing_config
  add column if not exists section_services_title    text,
  add column if not exists section_services_subtitle text,
  add column if not exists section_products_title    text,
  add column if not exists section_products_subtitle text,
  add column if not exists section_packages_title    text,
  add column if not exists section_packages_subtitle text;
