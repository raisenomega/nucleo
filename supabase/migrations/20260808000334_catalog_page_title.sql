-- LANDING-CATALOG-UX Rodaja 4: título/subtítulo editables de la página pública /catalog (mismo patrón que
-- LANDING-HOME-UX Rodaja A / migr 326). Nullable → cuando NULL el frontend cae al i18n (lpCatalogTitle) y el
-- subtítulo no se renderiza. Fluyen al público vía to_jsonb(tenant_landing_config) en home.hero (CatalogPage ya
-- usa useLandingHome) → sin tocar el RPC.
alter table public.tenant_landing_config
  add column if not exists catalog_page_title    text,
  add column if not exists catalog_page_subtitle text;
