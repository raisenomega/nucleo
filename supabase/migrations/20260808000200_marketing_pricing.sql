-- 200 · Rodaja Pricing E2E (platform-level). Config de sección (eyebrow+título) + N tiers (nombre,
-- precio, moneda, período, tagline, features ES-EN, CTA, recomendado, activo, orden). Editable desde
-- /web/precios. RLS lectura pública / escritura is_superadmin(). Seed = 3 planes NÚCLEO. Patrón migr 199.

create table if not exists public.marketing_pricing_config (
  id uuid primary key default gen_random_uuid(),
  eyebrow_es text not null default 'Precios',
  eyebrow_en text not null default 'Pricing',
  title_es text not null default 'Planes que escalan contigo',
  title_en text not null default 'Plans that scale with you',
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  name_es text not null default '', name_en text not null default '',
  price numeric(10,2) not null default 0,
  currency text not null default 'USD',
  billing_period text not null default 'month' check (billing_period in ('month','year','one_time')),
  tagline_es text not null default '', tagline_en text not null default '',
  features_es text[] not null default '{}', features_en text[] not null default '{}',
  cta_label_es text not null default 'Empezar', cta_label_en text not null default 'Get started',
  cta_href text not null default '#lead-form',
  is_recommended boolean not null default false,
  is_active boolean not null default true,
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_marketing_pricing_config_updated_at on public.marketing_pricing_config;
create trigger set_marketing_pricing_config_updated_at before update on public.marketing_pricing_config
  for each row execute function public.set_updated_at();
drop trigger if exists set_marketing_pricing_tiers_updated_at on public.marketing_pricing_tiers;
create trigger set_marketing_pricing_tiers_updated_at before update on public.marketing_pricing_tiers
  for each row execute function public.set_updated_at();

insert into public.marketing_pricing_config (id) select gen_random_uuid()
  where not exists (select 1 from public.marketing_pricing_config);

insert into public.marketing_pricing_tiers (name_es, name_en, price, tagline_es, tagline_en, features_es, features_en, is_recommended, display_order)
select * from (values
  ('Starter','Starter',49,'Para empezar a digitalizar tu operación','Start digitalizing your operation',
    array['Hasta 2 módulos','Landing white-label','Soporte por email','1 usuario admin'],
    array['Up to 2 modules','White-label landing','Email support','1 admin user'], false, 1),
  ('Pro','Pro',149,'El favorito de negocios de servicio','The favorite of service businesses',
    array['Todos los módulos','Landing + SEO + PWA','Soporte prioritario','Usuarios ilimitados','Agentes IA','Fiscal PR'],
    array['All modules','Landing + SEO + PWA','Priority support','Unlimited users','AI agents','PR tax compliance'], true, 2),
  ('Enterprise','Enterprise',349,'Máximo poder y soporte dedicado','Maximum power and dedicated support',
    array['Todo en Pro','Soporte dedicado 24/7','Onboarding personalizado','API access','Multi-tenant','SLA garantizado'],
    array['Everything in Pro','Dedicated 24/7 support','Custom onboarding','API access','Multi-tenant','Guaranteed SLA'], false, 3)
) v where not exists (select 1 from public.marketing_pricing_tiers);

alter table public.marketing_pricing_config enable row level security;
alter table public.marketing_pricing_tiers enable row level security;
drop policy if exists mpricec_select on public.marketing_pricing_config;
create policy mpricec_select on public.marketing_pricing_config for select using (true);
drop policy if exists mpricec_admin on public.marketing_pricing_config;
create policy mpricec_admin on public.marketing_pricing_config for all using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists mpricet_select on public.marketing_pricing_tiers;
create policy mpricet_select on public.marketing_pricing_tiers for select using (true);
drop policy if exists mpricet_admin on public.marketing_pricing_tiers;
create policy mpricet_admin on public.marketing_pricing_tiers for all using (public.is_superadmin()) with check (public.is_superadmin());
