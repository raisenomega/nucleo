-- Fase 3 · Sesión 1 · Migración 126: columnas landing + Stripe en tenants.
-- Feature flag landing_enabled, allowed_origins (whitelist RPCs de escritura), y config Stripe Connect.

alter table public.tenants
  add column if not exists landing_enabled boolean not null default false,
  add column if not exists allowed_origins jsonb not null default '[]'::jsonb,
  add column if not exists stripe_publishable_key text,
  add column if not exists stripe_secret_key_vault_name text,
  add column if not exists stripe_webhook_secret_vault_name text,
  add column if not exists stripe_connect_account_id text,
  add column if not exists stripe_enabled boolean not null default false,
  add column if not exists stripe_test_mode boolean not null default true;

create index if not exists idx_tenants_landing_enabled on public.tenants(landing_enabled) where landing_enabled = true;
create index if not exists idx_tenants_stripe_enabled on public.tenants(stripe_enabled) where stripe_enabled = true;

comment on column public.tenants.allowed_origins is 'Array de hostnames autorizados a llamar RPCs públicas de escritura del tenant. Ejemplo: ["zramos.com","www.zramos.com"]';
comment on column public.tenants.stripe_secret_key_vault_name is 'Nombre del secret en vault.secrets. Nunca almacenar SK en texto plano.';
comment on column public.tenants.stripe_test_mode is 'Si true, tenant usa Stripe test mode. Toggle a false cuando ready para producción.';
