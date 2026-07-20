-- 198 · Rodaja Features E2E de la landing comercial (platform-level). Config de sección (eyebrow+título) +
-- N features (icono lucide, título/desc/bullets ES-EN, orden, span, activo). Editable desde /web/features.
-- RLS lectura pública / escritura is_superadmin(). Seed = las 4 features de S2.6 (para verse idéntico).

create table if not exists public.marketing_features_config (
  id uuid primary key default gen_random_uuid(),
  eyebrow_es text not null default 'Plataforma',
  eyebrow_en text not null default 'Platform',
  title_es text not null default 'Todo lo que NÚCLEO hace por tu negocio',
  title_en text not null default 'Everything NÚCLEO does for your business',
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_features (
  id uuid primary key default gen_random_uuid(),
  icon_name text not null default 'Zap',
  title_es text not null default '', title_en text not null default '',
  description_es text not null default '', description_en text not null default '',
  bullets_es text[] not null default '{}', bullets_en text[] not null default '{}',
  display_order int not null default 0,
  col_span int not null default 1 check (col_span in (1, 2)),
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_marketing_features_config_updated_at on public.marketing_features_config;
create trigger set_marketing_features_config_updated_at before update on public.marketing_features_config
  for each row execute function public.set_updated_at();
drop trigger if exists set_marketing_features_updated_at on public.marketing_features;
create trigger set_marketing_features_updated_at before update on public.marketing_features
  for each row execute function public.set_updated_at();

insert into public.marketing_features_config (id) select gen_random_uuid()
  where not exists (select 1 from public.marketing_features_config);

insert into public.marketing_features (icon_name, title_es, title_en, description_es, description_en, bullets_es, bullets_en, display_order)
select * from (values
  ('FileText','Facturación inteligente','Smart billing','Cotizaciones → facturas → cobro, con aprobación pública y PDFs bajo tu marca.','Quotes → invoices → collection, with public approval and PDFs under your brand.',
    array['Cotizaciones con aprobación pública','Auto-facturación','PDFs white-label'], array['Quotes with public approval','Auto-invoicing','White-label PDFs'], 1),
  ('Route','Rutas y operaciones','Routes & operations','Paradas asignadas, evidencia fotográfica y servicios completados desde el móvil.','Assigned stops, photo evidence and services completed from mobile.',
    array['Paradas asignadas','Evidencia fotográfica','Completar desde el móvil'], array['Assigned stops','Photo evidence','Complete from mobile'], 2),
  ('BarChart3','Fiscal y reportes','Tax & reports','Motor fiscal de PR versionado, alertas de informativas y 4 pilares de reportes.','Versioned PR tax engine, filing alerts and 4-pillar reporting.',
    array['Motor fiscal PR versionado','Alertas de informativas','4 pilares de reportes'], array['Versioned PR tax engine','Filing alerts','4-pillar reports'], 3),
  ('Bot','IA y landing','AI & landing','Agentes entrenados en tu negocio y tu propia landing white-label con SEO y PWA.','Agents trained on your business and your own white-label landing with SEO and PWA.',
    array['Agentes entrenados en tu negocio','Landing white-label','SEO + PWA'], array['Agents trained on your business','White-label landing','SEO + PWA'], 4)
) v where not exists (select 1 from public.marketing_features);

alter table public.marketing_features_config enable row level security;
alter table public.marketing_features enable row level security;
drop policy if exists mfc_select on public.marketing_features_config;
create policy mfc_select on public.marketing_features_config for select using (true);
drop policy if exists mfc_admin on public.marketing_features_config;
create policy mfc_admin on public.marketing_features_config for all using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists mf_select on public.marketing_features;
create policy mf_select on public.marketing_features for select using (true);
drop policy if exists mf_admin on public.marketing_features;
create policy mf_admin on public.marketing_features for all using (public.is_superadmin()) with check (public.is_superadmin());
