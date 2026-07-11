-- Migración 131: columnas is_published (preparación Sub-fase 3.G Preview/Publicar, Opción C)
-- false=draft (solo panel admin) · true=published (landing pública). Toggle masivo desde botón Publicar.
alter table public.tenant_landing_products add column is_published boolean not null default false;
alter table public.tenant_landing_services add column is_published boolean not null default false;
alter table public.tenant_landing_packages add column is_published boolean not null default false;

-- Índices parciales para la consulta de la landing pública futura (WHERE is_published = true).
create index idx_products_published on public.tenant_landing_products (tenant_id, is_published, display_order) where is_published = true;
create index idx_services_published on public.tenant_landing_services (tenant_id, is_published, display_order) where is_published = true;
create index idx_packages_published on public.tenant_landing_packages (tenant_id, is_published, display_order) where is_published = true;

comment on column public.tenant_landing_products.is_published is 'Sub-fase 3.G: false=draft (solo panel admin), true=published (landing pública). Toggle masivo desde botón Publicar.';
comment on column public.tenant_landing_services.is_published is 'Sub-fase 3.G: false=draft (solo panel admin), true=published (landing pública). Toggle masivo desde botón Publicar.';
comment on column public.tenant_landing_packages.is_published is 'Sub-fase 3.G: false=draft (solo panel admin), true=published (landing pública). Toggle masivo desde botón Publicar.';
