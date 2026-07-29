-- ============================================================================
-- STRIPE-1 (Fase 1 · Camino A = API keys directas) · FUNDACIÓN
--   tenant_payment_config + stripe_product_map + stripe_payments + idempotencia en
--   stripe_webhook_events + RPCs de credenciales (save/get/validate vía Vault).
--   Secret keys en Supabase VAULT (NUNCA plaintext ni en columna). http ext → Stripe API.
--   Fee de plataforma = 0 en Fase 1 (columnas preparadas para Connect/Fase 2).
--   Sync de catálogo, checkout, webhook-processing y edge function = próxima rodaja.
-- ============================================================================

-- ── Config de pagos por tenant ──────────────────────────────────────────────
create table if not exists public.tenant_payment_config (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid unique not null references public.tenants(id) on delete cascade,
  stripe_enabled boolean not null default false,
  stripe_mode text not null default 'api_keys' check (stripe_mode in ('api_keys','connect')),
  stripe_publishable_key text,
  stripe_secret_vault_name text,      -- referencia al secret en Vault (no el secret)
  stripe_webhook_vault_name text,
  stripe_account_id text,
  stripe_test_mode boolean default true,
  stripe_last_validated_at timestamptz,
  stripe_validation_error text,
  accept_card boolean default true,
  accept_ach boolean default false,
  catalog_last_synced_at timestamptz,
  catalog_sync_status text check (catalog_sync_status in ('pending','syncing','completed','failed')),
  catalog_sync_error text,
  -- Fase 2 (Connect) — preparadas, sin uso en Fase 1:
  platform_fee_pct numeric not null default 0,
  platform_fee_type text not null default 'percentage' check (platform_fee_type in ('percentage','fixed')),
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.tenant_payment_config enable row level security;
drop policy if exists tpc_ceo on public.tenant_payment_config;
create policy tpc_ceo on public.tenant_payment_config for all
  using (tenant_id = current_tenant() and is_ceo_or_above())
  with check (tenant_id = current_tenant() and is_ceo_or_above());
revoke all on public.tenant_payment_config from anon;

-- ── Idempotencia + mapeo + pagos ────────────────────────────────────────────
alter table public.stripe_webhook_events add column if not exists stripe_event_id text;
create unique index if not exists uq_stripe_webhook_event_id on public.stripe_webhook_events(stripe_event_id) where stripe_event_id is not null;

create table if not exists public.stripe_product_map (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id) on delete cascade,
  landing_product_id uuid references public.tenant_landing_products(id) on delete cascade,
  stripe_product_id text not null,
  stripe_price_id text not null,
  last_synced_at timestamptz default now(),
  unique (tenant_id, inventory_item_id),
  unique (tenant_id, landing_product_id),
  check (inventory_item_id is not null or landing_product_id is not null)
);
alter table public.stripe_product_map enable row level security;
drop policy if exists spm_tenant on public.stripe_product_map;
create policy spm_tenant on public.stripe_product_map for select using (tenant_id = current_tenant());
revoke all on public.stripe_product_map from anon;

create table if not exists public.stripe_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  stripe_payment_intent_id text unique not null,
  stripe_charge_id text,
  invoice_id uuid references public.invoices(id) on delete set null,
  landing_order_id uuid references public.tenant_landing_orders(id) on delete set null,
  amount numeric not null,
  currency text default 'usd',
  status text not null check (status in ('pending','succeeded','failed','refunded','disputed')),
  payment_method_type text,
  metadata jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.stripe_payments enable row level security;
drop policy if exists sp_tenant on public.stripe_payments;
create policy sp_tenant on public.stripe_payments for select using (tenant_id = current_tenant() and is_ceo_or_above());
revoke all on public.stripe_payments from anon;

-- ── Helper: upsert de secret en Vault (name no es unique → buscar y actualizar) ─
create or replace function public._vault_upsert(_name text, _secret text)
 returns void language plpgsql security definer set search_path to 'public','vault','extensions'
as $fn$
declare _id uuid;
begin
  select id into _id from vault.secrets where name = _name limit 1;
  if _id is not null then perform vault.update_secret(_id, _secret, _name);
  else perform vault.create_secret(_secret, _name); end if;
end $fn$;

-- ── TAREA 2a · save_stripe_credentials (CEO+) ───────────────────────────────
create or replace function public.save_stripe_credentials(p_publishable_key text, p_secret_key text, p_webhook_secret text default null)
 returns jsonb language plpgsql security definer set search_path to 'public','vault','extensions'
as $fn$
declare _t uuid := current_tenant(); _sk_name text := 'stripe_sk_'||current_tenant()::text; _wh_name text; _test boolean;
begin
  if not is_ceo_or_above() then raise exception 'No autorizado' using errcode='42501'; end if;
  if coalesce(p_publishable_key,'') !~ '^pk_(test|live)_' then return jsonb_build_object('saved',false,'error','Publishable key inválida (debe empezar con pk_test_ o pk_live_)'); end if;
  if coalesce(p_secret_key,'') !~ '^(sk|rk)_(test|live)_' then return jsonb_build_object('saved',false,'error','Secret key inválida (debe empezar con sk_test_ o sk_live_)'); end if;
  _test := p_publishable_key like 'pk_test_%';
  perform public._vault_upsert(_sk_name, p_secret_key);
  if coalesce(trim(p_webhook_secret),'') <> '' then _wh_name := 'stripe_whsec_'||_t::text; perform public._vault_upsert(_wh_name, p_webhook_secret); end if;
  insert into public.tenant_payment_config (tenant_id, stripe_mode, stripe_publishable_key, stripe_secret_vault_name, stripe_webhook_vault_name, stripe_test_mode)
    values (_t, 'api_keys', p_publishable_key, _sk_name, _wh_name, _test)
  on conflict (tenant_id) do update set stripe_publishable_key = excluded.stripe_publishable_key,
    stripe_secret_vault_name = excluded.stripe_secret_vault_name,
    stripe_webhook_vault_name = coalesce(excluded.stripe_webhook_vault_name, public.tenant_payment_config.stripe_webhook_vault_name),
    stripe_test_mode = excluded.stripe_test_mode, stripe_validation_error = null, updated_at = now();
  return jsonb_build_object('saved', true);
end $fn$;

-- ── TAREA 2c · get_stripe_config (sin secrets) ──────────────────────────────
create or replace function public.get_stripe_config()
 returns jsonb language plpgsql security definer set search_path to 'public'
as $fn$
declare _c record;
begin
  if not is_ceo_or_above() then raise exception 'No autorizado' using errcode='42501'; end if;
  select * into _c from public.tenant_payment_config where tenant_id = current_tenant();
  if _c.tenant_id is null then return jsonb_build_object('configured', false); end if;
  return jsonb_build_object('configured', true, 'stripeEnabled', _c.stripe_enabled, 'mode', _c.stripe_mode,
    'publishableKey', _c.stripe_publishable_key, 'accountId', _c.stripe_account_id, 'testMode', _c.stripe_test_mode,
    'lastValidatedAt', _c.stripe_last_validated_at, 'validationError', _c.stripe_validation_error,
    'acceptCard', _c.accept_card, 'acceptAch', _c.accept_ach, 'hasSecret', _c.stripe_secret_vault_name is not null,
    'hasWebhook', _c.stripe_webhook_vault_name is not null, 'catalogLastSyncedAt', _c.catalog_last_synced_at,
    'catalogSyncStatus', _c.catalog_sync_status);
end $fn$;

-- ── TAREA 2b · validate_stripe_credentials (GET /v1/account) ─────────────────
create or replace function public.validate_stripe_credentials()
 returns jsonb language plpgsql security definer set search_path to 'public','vault','extensions'
as $fn$
declare _t uuid := current_tenant(); _name text; _sk text; _st int; _resp text; _acct text; _err text;
begin
  if not is_ceo_or_above() then raise exception 'No autorizado' using errcode='42501'; end if;
  select stripe_secret_vault_name into _name from public.tenant_payment_config where tenant_id = _t;
  if _name is null then return jsonb_build_object('valid', false, 'error', 'No hay credenciales guardadas'); end if;
  select decrypted_secret into _sk from vault.decrypted_secrets where name = _name limit 1;
  if _sk is null then return jsonb_build_object('valid', false, 'error', 'Secret no encontrada en Vault'); end if;
  begin
    perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '8000');
    select status, content into _st, _resp from http(('GET', 'https://api.stripe.com/v1/account',
      array[http_header('Authorization', 'Bearer '||_sk)], null, null)::http_request);
  exception when others then
    update public.tenant_payment_config set stripe_validation_error = left(sqlerrm,300), stripe_enabled = false, updated_at = now() where tenant_id = _t;
    return jsonb_build_object('valid', false, 'error', sqlerrm);
  end;
  if _st = 200 then
    _acct := (_resp::jsonb)->>'id';
    update public.tenant_payment_config set stripe_account_id = _acct, stripe_last_validated_at = now(),
      stripe_validation_error = null, stripe_enabled = true, updated_at = now() where tenant_id = _t;
    return jsonb_build_object('valid', true, 'account_id', _acct);
  else
    _err := coalesce(nullif((_resp::jsonb)->'error'->>'message',''), 'HTTP '||coalesce(_st,0)::text);
    update public.tenant_payment_config set stripe_validation_error = _err, stripe_enabled = false, updated_at = now() where tenant_id = _t;
    return jsonb_build_object('valid', false, 'error', _err);
  end if;
end $fn$;

-- ── Grants (todo CEO+ del tenant; helper interno sin anon) ───────────────────
revoke execute on function public._vault_upsert(text,text) from public, anon;
revoke execute on function public.save_stripe_credentials(text,text,text) from public, anon;
grant  execute on function public.save_stripe_credentials(text,text,text) to authenticated;
revoke execute on function public.get_stripe_config() from public, anon;
grant  execute on function public.get_stripe_config() to authenticated;
revoke execute on function public.validate_stripe_credentials() from public, anon;
grant  execute on function public.validate_stripe_credentials() to authenticated;
