-- Migración 142: Order System producción-ready — Form Builder + Pricing Engine + Payment Methods
-- + Coupons + Migration helpers + audit. SOLO schema/RLS/índices/funciones. Sin UI, sin RPC pública create_order.
-- Correcciones de premisa (pre-flight #69): source_ip ya existe (skip); pg_net no disponible (webhooks usarán http);
-- order_status_history es order-scoped → audit de forms va a tenant_audit_log genérico (9 tablas, no 8).

-- ══════════ 1) FORM BUILDER ══════════
create table if not exists public.tenant_order_forms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, description text,
  is_default boolean not null default false,
  applies_to_kind text check (applies_to_kind in ('product','service','package')),
  applies_to_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_order_forms_tenant on public.tenant_order_forms(tenant_id) where is_active;

create table if not exists public.tenant_order_form_fields (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  form_id uuid not null references public.tenant_order_forms(id) on delete cascade,
  order_index int not null default 0,
  kind text not null check (kind in ('text','email','tel','textarea','select','radio','checkbox','number','date','address_block','matrix','addons_group','repeatable_group','file_upload')),
  field_key text not null,
  label_es text not null, label_en text,
  placeholder_es text, placeholder_en text,
  required boolean not null default false,
  validation_rules jsonb not null default '{}'::jsonb,
  options jsonb not null default '[]'::jsonb,
  conditional_on jsonb,
  group_name text,
  created_at timestamptz not null default now(),
  unique (form_id, field_key)
);
create index if not exists idx_form_fields_form on public.tenant_order_form_fields(form_id, order_index);

-- ══════════ 2) PRICING ENGINE ══════════
create table if not exists public.tenant_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  applies_to_kind text check (applies_to_kind in ('product','service','package')),
  applies_to_id uuid,
  rule_type text not null check (rule_type in ('flat','tiered_qty','matrix_2d','percentage_discount','coupon','tax','shipping')),
  config jsonb not null default '{}'::jsonb,
  priority int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_pricing_rules_tenant on public.tenant_pricing_rules(tenant_id, rule_type, priority desc) where is_active;

-- ══════════ 3) PAYMENT METHODS ══════════
create table if not exists public.tenant_payment_methods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  method_key text not null check (method_key in ('stripe_connect','ath_movil','bank_transfer','cash_on_delivery','offline_coordination')),
  is_active boolean not null default true,
  is_default boolean not null default false,
  config_vault_key text,
  display_name jsonb not null default '{}'::jsonb,
  instructions jsonb not null default '{}'::jsonb,
  display_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, method_key)
);
create index if not exists idx_payment_methods_tenant on public.tenant_payment_methods(tenant_id, display_order) where is_active;

-- ══════════ 4) CUPONES ══════════
create table if not exists public.tenant_coupons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  value numeric(12,2) not null check (value >= 0),
  applies_to_kind text check (applies_to_kind in ('product','service','package')),
  expires_at timestamptz, max_uses int, current_uses int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  coupon_id uuid not null references public.tenant_coupons(id) on delete cascade,
  order_id uuid references public.tenant_landing_orders(id) on delete set null,
  redeemed_at timestamptz not null default now()
);
create index if not exists idx_coupon_redemptions on public.coupon_redemptions(coupon_id, redeemed_at desc);

-- ══════════ 5) MIGRATION HELPERS ══════════
create table if not exists public.tenant_migration_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source text not null,
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  records_total int not null default 0, records_success int not null default 0, records_failed int not null default 0,
  notes text, created_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_migration_batches_tenant on public.tenant_migration_batches(tenant_id, created_at desc);

create table if not exists public.tenant_migration_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  batch_id uuid not null references public.tenant_migration_batches(id) on delete cascade,
  source_ref text, mapping jsonb not null default '{}'::jsonb,
  target_table text, target_id uuid,
  status text not null default 'pending' check (status in ('pending','success','failed')), error text,
  created_at timestamptz not null default now()
);
create index if not exists idx_migration_records_batch on public.tenant_migration_records(batch_id, status);

-- ══════════ 6) AUDIT LOG genérico (target correcto para audit de forms) ══════════
create table if not exists public.tenant_audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entity_type text not null, entity_id uuid, action text not null,
  actor uuid references auth.users(id), changes jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_log_tenant on public.tenant_audit_log(tenant_id, entity_type, created_at desc);

-- ══════════ 7) EXTENSIÓN tenant_landing_orders (10 cols; source_ip ya existe → skip) ══════════
alter table public.tenant_landing_orders
  add column if not exists form_id uuid references public.tenant_order_forms(id) on delete set null,
  add column if not exists payment_method_key text,
  add column if not exists payment_status text not null default 'unpaid' check (payment_status in ('unpaid','awaiting','processing','paid','refunded','failed')),
  add column if not exists order_type text not null default 'one_time' check (order_type in ('one_time','subscription','mixed')),
  add column if not exists billing_frequency text,
  add column if not exists custom_fields jsonb not null default '{}'::jsonb,
  add column if not exists pricing_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists idempotency_key uuid unique,
  add column if not exists user_agent text,
  add column if not exists referrer text;

-- ══════════ 8) RLS + policies ══════════
alter table public.tenant_order_forms enable row level security;
alter table public.tenant_order_form_fields enable row level security;
alter table public.tenant_pricing_rules enable row level security;
alter table public.tenant_payment_methods enable row level security;
alter table public.tenant_coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.tenant_migration_batches enable row level security;
alter table public.tenant_migration_records enable row level security;
alter table public.tenant_audit_log enable row level security;

-- Public SELECT (render de landing): forms + fields + payment methods activos
create policy order_forms_public on public.tenant_order_forms for select using (is_active = true);
create policy order_forms_ceo on public.tenant_order_forms for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
create policy form_fields_public on public.tenant_order_form_fields for select using (true);
create policy form_fields_ceo on public.tenant_order_form_fields for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
create policy payment_methods_public on public.tenant_payment_methods for select using (is_active = true);
create policy payment_methods_ceo on public.tenant_payment_methods for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());

-- CEO-only (internas)
create policy pricing_rules_ceo on public.tenant_pricing_rules for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
create policy coupons_ceo on public.tenant_coupons for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
create policy coupon_redemptions_select on public.coupon_redemptions for select using (tenant_id = current_tenant());
create policy migration_batches_ceo on public.tenant_migration_batches for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
create policy migration_records_ceo on public.tenant_migration_records for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
create policy audit_log_ceo on public.tenant_audit_log for select using (tenant_id = current_tenant() and public.is_ceo_or_above());

grant select on public.tenant_order_forms, public.tenant_order_form_fields, public.tenant_payment_methods to anon, authenticated;

-- ══════════ 9) FUNCIONES ══════════
-- Recálculo server-side del total (revalida contra reglas del tenant + cupón). Read-only.
create or replace function public.calculate_order_total(_items jsonb, _tenant uuid, _coupon_code text default null)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $fn$
declare _subtotal numeric := 0; _tax numeric := 0; _ship numeric := 0; _disc numeric := 0; _taxpct numeric; _c record;
begin
  select coalesce(sum((i->>'price')::numeric * coalesce(nullif(i->>'qty','')::numeric, 1)), 0) into _subtotal
    from jsonb_array_elements(coalesce(_items, '[]'::jsonb)) i;
  select (config->>'percentage')::numeric into _taxpct from public.tenant_pricing_rules
    where tenant_id = _tenant and rule_type = 'tax' and is_active order by priority desc limit 1;
  _tax := round(_subtotal * coalesce(_taxpct, 0) / 100.0, 2);
  select coalesce((config->>'amount')::numeric, 0) into _ship from public.tenant_pricing_rules
    where tenant_id = _tenant and rule_type = 'shipping' and is_active order by priority desc limit 1;
  _ship := coalesce(_ship, 0);
  if coalesce(_coupon_code, '') <> '' then
    select * into _c from public.tenant_coupons where tenant_id = _tenant and code = _coupon_code and is_active
      and (expires_at is null or expires_at > now()) and (max_uses is null or current_uses < max_uses) limit 1;
    if found then
      _disc := case when _c.discount_type = 'percentage' then round(_subtotal * _c.value / 100.0, 2) else least(_c.value, _subtotal) end;
    end if;
  end if;
  return jsonb_build_object('subtotal', _subtotal, 'tax', _tax, 'shipping', _ship, 'discount', _disc,
    'total', round(_subtotal + _tax + _ship - _disc, 2),
    'breakdown', jsonb_build_object('tax_pct', coalesce(_taxpct, 0), 'coupon_applied', _disc > 0));
end $fn$;
grant execute on function public.calculate_order_total(jsonb, uuid, text) to anon, authenticated;

-- Valida data contra el schema del form (campos requeridos). Read-only.
create or replace function public.validate_order_form_data(_form_id uuid, _data jsonb)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $fn$
declare _errors jsonb := '[]'::jsonb; _f record;
begin
  for _f in select field_key, required from public.tenant_order_form_fields where form_id = _form_id loop
    if _f.required and coalesce(btrim(_data->>_f.field_key), '') = '' then
      _errors := _errors || jsonb_build_object('field', _f.field_key, 'error', 'required');
    end if;
  end loop;
  return jsonb_build_object('valid', jsonb_array_length(_errors) = 0, 'errors', _errors);
end $fn$;
grant execute on function public.validate_order_form_data(uuid, jsonb) to anon, authenticated;

-- ══════════ 10) TRIGGERS ══════════
-- updated_at en tablas mutables (reusa set_updated_at existente)
create trigger trg_forms_updated before update on public.tenant_order_forms for each row execute function public.set_updated_at();
create trigger trg_pricing_updated before update on public.tenant_pricing_rules for each row execute function public.set_updated_at();
create trigger trg_payment_updated before update on public.tenant_payment_methods for each row execute function public.set_updated_at();
create trigger trg_migbatch_updated before update on public.tenant_migration_batches for each row execute function public.set_updated_at();

-- Audit de cambios de form fields → tenant_audit_log (order_status_history es order-scoped, no aplica)
create or replace function public._audit_form_field_change()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
begin
  insert into public.tenant_audit_log (tenant_id, entity_type, entity_id, action, actor, changes)
  values (coalesce(new.tenant_id, old.tenant_id), 'order_form_field', coalesce(new.id, old.id), tg_op, auth.uid(),
    jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)));
  return coalesce(new, old);
end $fn$;
create trigger trg_audit_form_fields after insert or update or delete on public.tenant_order_form_fields
  for each row execute function public._audit_form_field_change();

-- Valida + consume cupón al redimir (atómico)
create or replace function public._validate_coupon_before_use()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
declare _c record;
begin
  select * into _c from public.tenant_coupons where id = new.coupon_id for update;
  if not found or not _c.is_active then raise exception 'coupon_inactive'; end if;
  if _c.expires_at is not null and _c.expires_at <= now() then raise exception 'coupon_expired'; end if;
  if _c.max_uses is not null and _c.current_uses >= _c.max_uses then raise exception 'coupon_exhausted'; end if;
  update public.tenant_coupons set current_uses = current_uses + 1 where id = new.coupon_id;
  return new;
end $fn$;
create trigger trg_validate_coupon before insert on public.coupon_redemptions
  for each row execute function public._validate_coupon_before_use();
