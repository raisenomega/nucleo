-- 20260808000304_invoice_public_page.sql
-- PDF-POLISH: página pública de factura (patrón cotización /aprobar/$token). El WhatsApp de factura ahora
-- linkea a https://{tenants.primary_domain}/factura/{public_token} (preview branded del dominio del tenant)
-- en vez de una URL cruda de Supabase Storage. Sin auth: RPC definer que no expone datos internos.

alter table public.invoices add column if not exists public_token text;
update public.invoices set public_token = gen_random_uuid()::text where public_token is null;
alter table public.invoices alter column public_token set default gen_random_uuid()::text;
create unique index if not exists idx_invoices_public_token on public.invoices(public_token);

-- URL branded para compartir (site del tenant + /factura/token). Gated al tenant del JWT.
create or replace function public.get_invoice_share_url(p_invoice_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare _tok text; _site text; _t uuid := public.current_tenant();
begin
  select public_token into _tok from public.invoices where id = p_invoice_id and tenant_id = _t;
  if _tok is null then return null; end if;
  select 'https://' || coalesce(nullif(trim(t.primary_domain), ''), 'nucleoraisen.com') into _site from public.tenants t where t.id = _t;
  return _site || '/factura/' || _tok;
end $$;

-- Fetch público (anon) por token: factura + branding del tenant. NO expone datos internos ni otros tenants.
create or replace function public.get_public_invoice(p_token text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare _q record; _hash text;
begin
  _hash := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if public._public_rate_hit(_hash) > 30 then return jsonb_build_object('status', 'rate_limited'); end if;
  select i.invoice_number, i.client_name, i.phone, i.email, i.items, i.subtotal, i.tax, i.total, i.status, i.due_date, i.created_at, i.pdf_url,
         t.display_name, t.legal_name, t.contact_phone, th.primary_color, th.accent_color, th.logo_url
    into _q from public.invoices i
    join public.tenants t on t.id = i.tenant_id
    left join public.tenant_themes th on th.tenant_id = i.tenant_id
    where i.public_token = p_token;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  return jsonb_build_object('status', 'valid',
    'invoice', jsonb_build_object('invoice_number', _q.invoice_number, 'client_name', _q.client_name, 'phone', _q.phone, 'email', _q.email,
      'items', _q.items, 'subtotal', _q.subtotal, 'tax', _q.tax, 'total', _q.total, 'status', _q.status, 'due_date', _q.due_date, 'created_at', _q.created_at),
    'tenant', jsonb_build_object('display_name', _q.display_name, 'legal_name', _q.legal_name, 'contact_phone', _q.contact_phone,
      'primary_color', coalesce(_q.primary_color, '#1a1a2e'), 'accent_color', coalesce(_q.accent_color, '#4a4a6a'), 'logo_url', _q.logo_url),
    'pdf_url', _q.pdf_url);
end $$;

-- draft → sent al enviar (dispara el posting GL de la factura si el tenant tiene gl_enabled, migr 270).
create or replace function public.mark_invoice_sent(p_invoice_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.invoices set status = 'sent'
    where id = p_invoice_id and tenant_id = public.current_tenant() and status = 'draft';
end $$;

grant execute on function public.get_public_invoice(text) to anon, authenticated;
grant execute on function public.get_invoice_share_url(uuid) to authenticated;
grant execute on function public.mark_invoice_sent(uuid) to authenticated;
