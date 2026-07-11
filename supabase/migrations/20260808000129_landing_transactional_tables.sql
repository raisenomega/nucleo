-- Fase 3 · Sesión 2B · Migración 129: tablas transaccionales + agregados de landing.
-- orders (normal), analytics (PARTITION BY RANGE + DEFAULT), stripe_webhook_events (normal, RLS deny-all),
-- metrics_daily + metrics_monthly (agregados, no particionados).

-- 2.11 tenant_landing_orders
create table if not exists public.tenant_landing_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_number text not null, session_id text,
  customer_name text not null, customer_email text not null, customer_phone text, customer_address jsonb,
  items jsonb not null,
  subtotal numeric(12,2) not null, tax numeric(12,2) not null default 0, shipping numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0, total numeric(12,2) not null, currency text not null default 'USD',
  status text not null default 'pending' check (status in
    ('pending','awaiting_payment','paid','processing','shipped','delivered','canceled','refunded')),
  stripe_checkout_session_id text, stripe_payment_intent_id text, stripe_charge_id text, stripe_customer_id text,
  linked_lead_id uuid references public.leads(id) on delete set null,
  linked_invoice_id uuid references public.invoices(id) on delete set null,
  source_hostname text, source_ip text, utm_source text, utm_medium text, utm_campaign text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), paid_at timestamptz,
  unique (tenant_id, order_number)
);
create index if not exists idx_tenant_landing_orders_tenant_status on public.tenant_landing_orders(tenant_id, status, created_at desc);
create unique index if not exists idx_tenant_landing_orders_stripe_pi on public.tenant_landing_orders(stripe_payment_intent_id) where stripe_payment_intent_id is not null;
create index if not exists idx_tenant_landing_orders_session on public.tenant_landing_orders(session_id) where session_id is not null;
create index if not exists idx_tenant_landing_orders_customer_email on public.tenant_landing_orders(tenant_id, lower(customer_email));
alter table public.tenant_landing_orders enable row level security;
create policy tenant_landing_orders_select on public.tenant_landing_orders for select using (tenant_id = current_tenant());
create policy tenant_landing_orders_all on public.tenant_landing_orders for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
drop trigger if exists trg_tenant_landing_orders_updated on public.tenant_landing_orders;
create trigger trg_tenant_landing_orders_updated before update on public.tenant_landing_orders for each row execute function public.set_updated_at();

-- 2.12 tenant_landing_analytics (PARTICIONADA por mes + DEFAULT)
create table if not exists public.tenant_landing_analytics (
  id bigint generated always as identity,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_type text not null check (event_type in (
    'page_view','product_view','service_view','faq_view','blog_view',
    'add_to_cart','remove_from_cart','checkout_started','checkout_completed',
    'form_contact_submitted','form_quote_submitted','form_order_submitted',
    'phone_click','whatsapp_click','email_click','social_click')),
  path text, entity_id uuid, session_id text, visitor_id text,
  referrer text, user_agent text, country text, region text, city text,
  utm_source text, utm_medium text, utm_campaign text, metadata jsonb,
  created_at timestamptz not null default now(),
  primary key (id, created_at)
) partition by range (created_at);
create index if not exists idx_tenant_landing_analytics_tenant_type_date on public.tenant_landing_analytics(tenant_id, event_type, created_at desc);
create index if not exists idx_tenant_landing_analytics_session on public.tenant_landing_analytics(session_id, created_at) where session_id is not null;
alter table public.tenant_landing_analytics enable row level security;
create policy tenant_landing_analytics_select on public.tenant_landing_analytics for select
  using (tenant_id = current_tenant() and public.is_ceo_or_above());
create table if not exists public.tenant_landing_analytics_2026_07 partition of public.tenant_landing_analytics for values from ('2026-07-01') to ('2026-08-01');
create table if not exists public.tenant_landing_analytics_2026_08 partition of public.tenant_landing_analytics for values from ('2026-08-01') to ('2026-09-01');
create table if not exists public.tenant_landing_analytics_2026_09 partition of public.tenant_landing_analytics for values from ('2026-09-01') to ('2026-10-01');
create table if not exists public.tenant_landing_analytics_2026_10 partition of public.tenant_landing_analytics for values from ('2026-10-01') to ('2026-11-01');
create table if not exists public.tenant_landing_analytics_default partition of public.tenant_landing_analytics default;

-- 2.14 stripe_webhook_events (NO particionada — idempotencia por event.id; RLS deny-all)
create table if not exists public.stripe_webhook_events (
  id text primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  event_type text not null, payload jsonb not null,
  processed boolean not null default false, processing_error text,
  received_at timestamptz not null default now(), processed_at timestamptz
);
create index if not exists idx_stripe_webhook_events_unprocessed on public.stripe_webhook_events(received_at) where processed = false;
create index if not exists idx_stripe_webhook_events_type_unprocessed on public.stripe_webhook_events(event_type) where processed = false;
create index if not exists idx_stripe_webhook_events_tenant on public.stripe_webhook_events(tenant_id, event_type, received_at desc);
alter table public.stripe_webhook_events enable row level security;  -- cero policies = deny-all; solo service_role / SECURITY DEFINER

-- Agregados (no particionados, retención infinita)
create table if not exists public.tenant_landing_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  metric_date date not null, event_type text not null,
  count int not null default 0, unique_sessions int not null default 0, unique_visitors int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, metric_date, event_type)
);
create index if not exists idx_tenant_landing_metrics_daily_tenant on public.tenant_landing_metrics_daily(tenant_id, metric_date desc);
alter table public.tenant_landing_metrics_daily enable row level security;
create policy tenant_landing_metrics_daily_select on public.tenant_landing_metrics_daily for select
  using (tenant_id = current_tenant() and public.is_ceo_or_above());

create table if not exists public.tenant_landing_metrics_monthly (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  metric_month date not null, event_type text not null,
  count int not null default 0, unique_sessions int not null default 0, unique_visitors int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, metric_month, event_type)
);
create index if not exists idx_tenant_landing_metrics_monthly_tenant on public.tenant_landing_metrics_monthly(tenant_id, metric_month desc);
alter table public.tenant_landing_metrics_monthly enable row level security;
create policy tenant_landing_metrics_monthly_select on public.tenant_landing_metrics_monthly for select
  using (tenant_id = current_tenant() and public.is_ceo_or_above());
