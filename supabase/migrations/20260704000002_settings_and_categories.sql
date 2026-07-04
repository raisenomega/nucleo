-- 20260704000002_settings_and_categories.sql
-- §5 categories (catálogo por tenant) + §6 settings (config por tenant). Sin seed.

-- §5 ESQUEMA — catálogo de categorías por tenant (reemplaza los ENUMs fijos).
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  kind text not null check (kind in ('income','expense','extraordinary','payment_method')),
  label text not null,
  sort int not null default 0,
  active boolean not null default true,
  unique (tenant_id, kind, label)
);

alter table public.categories enable row level security;
create policy categories_tenant_select on public.categories
  for select to authenticated
  using ( tenant_id = public.current_tenant() );
-- Escritura = onboarding/admin vía service_role. Policies por rol → Fase 3 (role functions).

-- §6 ESQUEMA — configuración por tenant (clave/valor jsonb).
create table public.settings (
  tenant_id uuid not null references public.tenants(id),
  key text not null,
  value jsonb not null,
  primary key (tenant_id, key)
);

alter table public.settings enable row level security;
create policy settings_tenant_select on public.settings
  for select to authenticated
  using ( tenant_id = public.current_tenant() );
-- Escritura = onboarding/admin vía service_role. Policies por rol → Fase 3.
