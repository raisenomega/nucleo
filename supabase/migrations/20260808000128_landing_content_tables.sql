-- Fase 3 · Sesión 2A · Migración 128: 5 tablas de contenido de landing.
-- faqs, service_areas, blog_posts, testimonials, url_redirects. Mismo patrón que 127.

-- 2.7 tenant_landing_faqs
create table if not exists public.tenant_landing_faqs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category text, question text not null, answer text not null,
  display_order int not null default 0, is_active boolean not null default true,
  language text not null default 'es' check (language in ('es','en')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_tenant_landing_faqs_tenant_active on public.tenant_landing_faqs(tenant_id, language, is_active, display_order) where is_active = true;
alter table public.tenant_landing_faqs enable row level security;
create policy tenant_landing_faqs_select on public.tenant_landing_faqs for select using (tenant_id = current_tenant());
create policy tenant_landing_faqs_all on public.tenant_landing_faqs for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
drop trigger if exists trg_tenant_landing_faqs_updated on public.tenant_landing_faqs;
create trigger trg_tenant_landing_faqs_updated before update on public.tenant_landing_faqs for each row execute function public.set_updated_at();

-- 2.8 tenant_landing_service_areas
create table if not exists public.tenant_landing_service_areas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, slug text not null, region text,
  geo_lat numeric(10,7), geo_lng numeric(10,7), radius_km numeric(6,2),
  is_active boolean not null default true, display_order int not null default 0,
  extra_charge numeric(12,2) default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create index if not exists idx_tenant_landing_service_areas_tenant_active on public.tenant_landing_service_areas(tenant_id, is_active, display_order) where is_active = true;
alter table public.tenant_landing_service_areas enable row level security;
create policy tenant_landing_service_areas_select on public.tenant_landing_service_areas for select using (tenant_id = current_tenant());
create policy tenant_landing_service_areas_all on public.tenant_landing_service_areas for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
drop trigger if exists trg_tenant_landing_service_areas_updated on public.tenant_landing_service_areas;
create trigger trg_tenant_landing_service_areas_updated before update on public.tenant_landing_service_areas for each row execute function public.set_updated_at();

-- 2.9 tenant_landing_blog_posts
create table if not exists public.tenant_landing_blog_posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null, title text not null, excerpt text,
  content_markdown text not null, content_html text,
  featured_image_url text, author_name text, author_avatar_url text,
  category text, tags text[], language text not null default 'es' check (language in ('es','en')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  meta_title text, meta_description text, meta_og_image_url text, meta_canonical_url text,
  view_count int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, slug),
  constraint blog_published_needs_date check (status <> 'published' or published_at is not null)
);
create index if not exists idx_tenant_landing_blog_posts_tenant_published on public.tenant_landing_blog_posts(tenant_id, status, published_at desc) where status = 'published';
create index if not exists idx_tenant_landing_blog_posts_slug on public.tenant_landing_blog_posts(tenant_id, slug);
create index if not exists idx_tenant_landing_blog_posts_tags on public.tenant_landing_blog_posts using gin(tags);
alter table public.tenant_landing_blog_posts enable row level security;
create policy tenant_landing_blog_posts_select on public.tenant_landing_blog_posts for select using (tenant_id = current_tenant());
create policy tenant_landing_blog_posts_all on public.tenant_landing_blog_posts for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
drop trigger if exists trg_tenant_landing_blog_posts_updated on public.tenant_landing_blog_posts;
create trigger trg_tenant_landing_blog_posts_updated before update on public.tenant_landing_blog_posts for each row execute function public.set_updated_at();

-- 2.10 tenant_landing_testimonials
create table if not exists public.tenant_landing_testimonials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_name text not null, client_title text, client_avatar_url text, client_company text,
  content text not null, rating int check (rating between 1 and 5),
  is_active boolean not null default true, is_featured boolean not null default false, display_order int not null default 0,
  source text, source_url text, language text not null default 'es',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_tenant_landing_testimonials_active on public.tenant_landing_testimonials(tenant_id, is_active, display_order) where is_active = true;
alter table public.tenant_landing_testimonials enable row level security;
create policy tenant_landing_testimonials_select on public.tenant_landing_testimonials for select using (tenant_id = current_tenant());
create policy tenant_landing_testimonials_all on public.tenant_landing_testimonials for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
drop trigger if exists trg_tenant_landing_testimonials_updated on public.tenant_landing_testimonials;
create trigger trg_tenant_landing_testimonials_updated before update on public.tenant_landing_testimonials for each row execute function public.set_updated_at();

-- 2.13 tenant_landing_url_redirects (sin updated_at → sin trigger; 2 policies para consistencia)
create table if not exists public.tenant_landing_url_redirects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  from_path text not null, to_path text not null,
  redirect_type int not null default 301 check (redirect_type in (301,302,307,308)),
  is_active boolean not null default true, hit_count int not null default 0, last_hit_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, from_path)
);
create index if not exists idx_tenant_landing_redirects_tenant_active on public.tenant_landing_url_redirects(tenant_id, from_path) where is_active = true;
alter table public.tenant_landing_url_redirects enable row level security;
create policy tenant_landing_url_redirects_select on public.tenant_landing_url_redirects for select using (tenant_id = current_tenant());
create policy tenant_landing_url_redirects_all on public.tenant_landing_url_redirects for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
