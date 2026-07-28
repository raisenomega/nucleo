-- 20260808000305_order_customer_public_pages.sql
-- PDF-POLISH-3: páginas públicas branded de ORDEN y ESTADO DE CUENTA (mismo patrón que factura, migr 304).
-- El WhatsApp de orden/cliente linkeará a https://{tenants.primary_domain}/orden|estado-cuenta/{token}
-- (preview branded del dominio del tenant) en vez de una URL cruda de Supabase Storage.

alter table public.tenant_landing_orders add column if not exists public_token text;
update public.tenant_landing_orders set public_token = gen_random_uuid()::text where public_token is null;
alter table public.tenant_landing_orders alter column public_token set default gen_random_uuid()::text;
create unique index if not exists idx_orders_public_token on public.tenant_landing_orders(public_token);

alter table public.customer_profiles add column if not exists public_token text;
update public.customer_profiles set public_token = gen_random_uuid()::text where public_token is null;
alter table public.customer_profiles alter column public_token set default gen_random_uuid()::text;
create unique index if not exists idx_customers_public_token on public.customer_profiles(public_token);

-- Helper: site branded del tenant (https:// + primary_domain o fallback).
create or replace function public._tenant_site(_t uuid) returns text language sql stable set search_path = public as $$
  select 'https://' || coalesce(nullif(trim(t.primary_domain), ''), 'nucleoraisen.com') from public.tenants t where t.id = _t;
$$;

create or replace function public.get_order_share_url(p_order_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare _tok text; _t uuid := public.current_tenant();
begin
  select public_token into _tok from public.tenant_landing_orders where id = p_order_id and tenant_id = _t;
  return case when _tok is null then null else public._tenant_site(_t) || '/orden/' || _tok end;
end $$;

create or replace function public.get_customer_share_url(p_customer_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare _tok text; _t uuid := public.current_tenant();
begin
  select public_token into _tok from public.customer_profiles where id = p_customer_id and tenant_id = _t;
  return case when _tok is null then null else public._tenant_site(_t) || '/estado-cuenta/' || _tok end;
end $$;

-- Orden pública (anon): datos + items + branding. NO expone datos internos ni otros tenants.
create or replace function public.get_public_order(p_token text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare _o record; _hash text;
begin
  _hash := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if public._public_rate_hit(_hash) > 30 then return jsonb_build_object('status', 'rate_limited'); end if;
  select o.order_number, o.customer_name, o.customer_phone, o.customer_email, o.customer_address, o.items,
         o.subtotal, o.tax, o.shipping, o.discount, o.total, o.status, o.created_at, o.billing_frequency,
         o.source_hostname, o.custom_fields, t.display_name, t.legal_name, t.contact_phone,
         th.primary_color, th.accent_color, th.logo_url
    into _o from public.tenant_landing_orders o
    join public.tenants t on t.id = o.tenant_id
    left join public.tenant_themes th on th.tenant_id = o.tenant_id
    where o.public_token = p_token;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  return jsonb_build_object('status', 'valid',
    'order', jsonb_build_object('order_number', _o.order_number, 'customer_name', _o.customer_name, 'phone', _o.customer_phone,
      'email', _o.customer_email, 'address', _o.customer_address, 'items', _o.items, 'subtotal', _o.subtotal, 'tax', _o.tax,
      'shipping', _o.shipping, 'discount', _o.discount, 'total', _o.total, 'status', _o.status, 'created_at', _o.created_at,
      'billing_frequency', _o.billing_frequency, 'source', _o.source_hostname, 'custom_fields', _o.custom_fields),
    'tenant', jsonb_build_object('display_name', _o.display_name, 'legal_name', _o.legal_name, 'contact_phone', _o.contact_phone,
      'primary_color', coalesce(_o.primary_color, '#1a1a2e'), 'accent_color', coalesce(_o.accent_color, '#4a4a6a'), 'logo_url', _o.logo_url));
end $$;

-- Estado de cuenta público (anon): nombre + AR (facturas pendientes + total + últimos pagos) + branding.
-- NO expone notas internas / segmento / descuento (solo lo que el cliente puede ver de su cuenta).
create or replace function public.get_public_customer_statement(p_token text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare _c record; _hash text; _due numeric; _invs jsonb; _pays jsonb;
begin
  _hash := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if public._public_rate_hit(_hash) > 30 then return jsonb_build_object('status', 'rate_limited'); end if;
  select cp.id, cp.tenant_id, cp.full_name, t.display_name, t.legal_name, t.contact_phone,
         th.primary_color, th.accent_color, th.logo_url
    into _c from public.customer_profiles cp
    join public.tenants t on t.id = cp.tenant_id
    left join public.tenant_themes th on th.tenant_id = cp.tenant_id
    where cp.public_token = p_token;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  select coalesce(sum(balance), 0), coalesce(jsonb_agg(jsonb_build_object('invoice_number', invoice_number, 'total', total,
    'balance', balance, 'due_date', due_date, 'days_overdue', greatest(0, current_date - due_date)) order by due_date), '[]'::jsonb)
    into _due, _invs from public.invoices where customer_id = _c.id and tenant_id = _c.tenant_id and status not in ('paid', 'cancelled');
  select coalesce(jsonb_agg(jsonb_build_object('date', ip.payment_date, 'amount', ip.amount, 'invoice_number', i.invoice_number) order by ip.payment_date desc), '[]'::jsonb)
    into _pays from public.invoice_payments ip join public.invoices i on i.id = ip.invoice_id
    where i.customer_id = _c.id and i.tenant_id = _c.tenant_id;
  return jsonb_build_object('status', 'valid', 'customer_name', _c.full_name, 'total_due', _due, 'invoices', _invs, 'payments', _pays,
    'tenant', jsonb_build_object('display_name', _c.display_name, 'legal_name', _c.legal_name, 'contact_phone', _c.contact_phone,
      'primary_color', coalesce(_c.primary_color, '#1a1a2e'), 'accent_color', coalesce(_c.accent_color, '#4a4a6a'), 'logo_url', _c.logo_url));
end $$;

grant execute on function public.get_public_order(text), public.get_public_customer_statement(text) to anon, authenticated;
grant execute on function public.get_order_share_url(uuid), public.get_customer_share_url(uuid) to authenticated;
