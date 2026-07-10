-- Fase 3 · Sesión 1 · Migración 127: 5 tablas core de landing.
-- config, categories, products, services, packages. RLS (SELECT tenant / ALL ceo+) + índices + triggers.

-- 2.2 tenant_landing_config
create table if not exists public.tenant_landing_config (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  hero_title text not null default '', hero_subtitle text not null default '',
  hero_cta_label text not null default 'Solicitar cotización',
  hero_cta_type text not null default 'quote' check (hero_cta_type in ('quote','order','contact','custom')),
  hero_cta_href text, hero_image_url text, hero_video_url text,
  meta_title text not null default '', meta_description text not null default '',
  meta_og_image_url text, meta_keywords text[],
  theme_variant text not null default 'glass-liquid' check (theme_variant in ('glass-liquid','minimalist','classic')),
  public_phone text, public_whatsapp text, public_email text, public_address text, business_hours jsonb,
  social_facebook text, social_instagram text, social_youtube text, social_tiktok text,
  schema_business_type text default 'LocalBusiness', schema_geo_lat numeric(10,7), schema_geo_lng numeric(10,7),
  schema_price_range text default '$$',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.tenant_landing_config enable row level security;
create policy tenant_landing_config_select on public.tenant_landing_config for select using (tenant_id = current_tenant());
create policy tenant_landing_config_all on public.tenant_landing_config for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
drop trigger if exists trg_tenant_landing_config_updated on public.tenant_landing_config;
create trigger trg_tenant_landing_config_updated before update on public.tenant_landing_config
  for each row execute function public.set_updated_at();

-- 2.3 tenant_landing_categories
create table if not exists public.tenant_landing_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null, name text not null, description text, icon_name text, image_url text,
  display_order int not null default 0, is_active boolean not null default true,
  category_type text not null check (category_type in ('product','service','both')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create index if not exists idx_tenant_landing_categories_tenant on public.tenant_landing_categories(tenant_id, is_active, display_order);
alter table public.tenant_landing_categories enable row level security;
create policy tenant_landing_categories_select on public.tenant_landing_categories for select using (tenant_id = current_tenant());
create policy tenant_landing_categories_all on public.tenant_landing_categories for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
drop trigger if exists trg_tenant_landing_categories_updated on public.tenant_landing_categories;
create trigger trg_tenant_landing_categories_updated before update on public.tenant_landing_categories
  for each row execute function public.set_updated_at();

-- 2.4 tenant_landing_products
create table if not exists public.tenant_landing_products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.tenant_landing_categories(id) on delete set null,
  slug text not null, sku text, name text not null, short_description text, long_description text,
  price numeric(12,2) not null, compare_at_price numeric(12,2), currency text not null default 'USD',
  tax_rate numeric(5,2) default 11.5, stripe_price_id text,
  track_inventory boolean not null default false, stock_quantity int, low_stock_threshold int default 5,
  primary_image_url text, gallery_images jsonb default '[]'::jsonb, video_url text,
  is_active boolean not null default true, is_featured boolean not null default false, display_order int not null default 0,
  attributes jsonb default '{}'::jsonb, meta_title text, meta_description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create index if not exists idx_tenant_landing_products_tenant_active on public.tenant_landing_products(tenant_id, is_active, display_order) where is_active = true;
create index if not exists idx_tenant_landing_products_category on public.tenant_landing_products(category_id) where category_id is not null;
create index if not exists idx_tenant_landing_products_featured on public.tenant_landing_products(tenant_id, is_featured) where is_featured = true and is_active = true;
alter table public.tenant_landing_products enable row level security;
create policy tenant_landing_products_select on public.tenant_landing_products for select using (tenant_id = current_tenant());
create policy tenant_landing_products_all on public.tenant_landing_products for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
drop trigger if exists trg_tenant_landing_products_updated on public.tenant_landing_products;
create trigger trg_tenant_landing_products_updated before update on public.tenant_landing_products
  for each row execute function public.set_updated_at();

-- 2.5 tenant_landing_services
create table if not exists public.tenant_landing_services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.tenant_landing_categories(id) on delete set null,
  slug text not null, name text not null, short_description text, long_description text,
  pricing_type text not null default 'quote_required' check (pricing_type in ('fixed','starting_from','quote_required','hourly')),
  price numeric(12,2), price_unit text, duration_estimate_minutes int, requires_scheduling boolean not null default true,
  primary_image_url text, gallery_images jsonb default '[]'::jsonb,
  is_active boolean not null default true, is_featured boolean not null default false, display_order int not null default 0,
  meta_title text, meta_description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create index if not exists idx_tenant_landing_services_tenant_active on public.tenant_landing_services(tenant_id, is_active, display_order) where is_active = true;
alter table public.tenant_landing_services enable row level security;
create policy tenant_landing_services_select on public.tenant_landing_services for select using (tenant_id = current_tenant());
create policy tenant_landing_services_all on public.tenant_landing_services for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
drop trigger if exists trg_tenant_landing_services_updated on public.tenant_landing_services;
create trigger trg_tenant_landing_services_updated before update on public.tenant_landing_services
  for each row execute function public.set_updated_at();

-- 2.6 tenant_landing_packages
create table if not exists public.tenant_landing_packages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null, name text not null, short_description text, long_description text,
  price numeric(12,2) not null, compare_at_price numeric(12,2), currency text not null default 'USD', stripe_price_id text,
  included_products jsonb default '[]'::jsonb, included_services jsonb default '[]'::jsonb, features_list text[],
  primary_image_url text, gallery_images jsonb default '[]'::jsonb,
  is_active boolean not null default true, is_featured boolean not null default false, display_order int not null default 0, badge_label text,
  meta_title text, meta_description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create index if not exists idx_tenant_landing_packages_tenant_active on public.tenant_landing_packages(tenant_id, is_active, display_order) where is_active = true;
alter table public.tenant_landing_packages enable row level security;
create policy tenant_landing_packages_select on public.tenant_landing_packages for select using (tenant_id = current_tenant());
create policy tenant_landing_packages_all on public.tenant_landing_packages for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
drop trigger if exists trg_tenant_landing_packages_updated on public.tenant_landing_packages;
create trigger trg_tenant_landing_packages_updated before update on public.tenant_landing_packages
  for each row execute function public.set_updated_at();

-- Bucket público para assets de landing (productos, servicios, blog, testimonios). Path: {tenant_id}/...
insert into storage.buckets (id, name, public) values ('landing-assets','landing-assets',true)
  on conflict (id) do nothing;

drop policy if exists landing_assets_public_read on storage.objects;
create policy landing_assets_public_read on storage.objects for select using (bucket_id = 'landing-assets');

drop policy if exists landing_assets_tenant_write on storage.objects;
create policy landing_assets_tenant_write on storage.objects for insert to authenticated
  with check (bucket_id = 'landing-assets' and (storage.foldername(name))[1] = current_tenant()::text and public.is_ceo_or_above());

drop policy if exists landing_assets_tenant_update on storage.objects;
create policy landing_assets_tenant_update on storage.objects for update to authenticated
  using (bucket_id = 'landing-assets' and (storage.foldername(name))[1] = current_tenant()::text and public.is_ceo_or_above());

drop policy if exists landing_assets_tenant_delete on storage.objects;
create policy landing_assets_tenant_delete on storage.objects for delete to authenticated
  using (bucket_id = 'landing-assets' and (storage.foldername(name))[1] = current_tenant()::text and public.is_ceo_or_above());
