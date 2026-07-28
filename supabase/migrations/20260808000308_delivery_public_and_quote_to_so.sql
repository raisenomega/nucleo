-- ============================================================================
-- V7+V8 · Cierre del arco de ventas
-- V7: página pública branded del conduce (/entrega/$token) — patrón factura/orden
-- V8: al aceptar cotización con fulfillment_enabled → crea Sales Order (no factura)
-- ============================================================================

-- ── V7 · Token público del conduce ──────────────────────────────────────────
alter table public.delivery_notes add column if not exists public_token text default gen_random_uuid()::text;
update public.delivery_notes set public_token = gen_random_uuid()::text where public_token is null;
create unique index if not exists idx_delivery_notes_public_token on public.delivery_notes (public_token) where public_token is not null;

-- RPC público (anon, rate-limited, patrón get_public_order). NO expone datos internos.
create or replace function public.get_public_delivery_note(p_token text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare _d record; _hash text; _items jsonb; _id uuid;
begin
  _hash := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if public._public_rate_hit(_hash) > 30 then return jsonb_build_object('status', 'rate_limited'); end if;
  select dn.id, dn.note_number, dn.status, dn.dispatch_date, dn.delivery_date, dn.shipping_address, dn.shipping_notes,
         dn.received_by, dn.signature_data, dn.created_at, so.order_number as so_number, cp.full_name as customer_name,
         t.display_name, t.legal_name, t.contact_phone, th.primary_color, th.accent_color, th.logo_url
    into _d from public.delivery_notes dn
    join public.tenants t on t.id = dn.tenant_id
    left join public.sales_orders so on so.id = dn.sales_order_id
    left join public.customer_profiles cp on cp.id = dn.customer_id
    left join public.tenant_themes th on th.tenant_id = dn.tenant_id
    where dn.public_token = p_token;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('description', di.description, 'qty', di.qty_dispatched) order by di.line_order), '[]'::jsonb)
    into _items from public.delivery_note_items di where di.delivery_note_id = _d.id;
  return jsonb_build_object('status', 'valid',
    'note', jsonb_build_object('note_number', _d.note_number, 'status', _d.status, 'dispatch_date', _d.dispatch_date,
      'delivery_date', _d.delivery_date, 'shipping_address', _d.shipping_address, 'shipping_notes', _d.shipping_notes,
      'received_by', _d.received_by, 'signature', _d.signature_data, 'so_number', _d.so_number, 'customer_name', _d.customer_name, 'items', _items),
    'tenant', jsonb_build_object('display_name', _d.display_name, 'legal_name', _d.legal_name, 'contact_phone', _d.contact_phone,
      'primary_color', coalesce(_d.primary_color, '#1a1a2e'), 'accent_color', coalesce(_d.accent_color, '#4a4a6a'), 'logo_url', _d.logo_url));
end $function$;
grant execute on function public.get_public_delivery_note(text) to anon;

-- Share URL branded (staff, tenant-scoped) → https://{primary_domain}/entrega/{token}
create or replace function public.get_delivery_share_url(p_note_id uuid)
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare _tok text; _t uuid := public.current_tenant();
begin
  select public_token into _tok from public.delivery_notes where id = p_note_id and tenant_id = _t;
  return case when _tok is null then null else public._tenant_site(_t) || '/entrega/' || _tok end;
end $function$;

-- ── V8 · Bifurcación quote→SO al aceptar (fulfillment_enabled) ───────────────
-- Idéntico al original salvo el bloque 'accepted': si el tenant tiene fulfillment
-- Y la cotización tiene cliente vinculado → crea Sales Order (no factura). Si no,
-- flujo original (convert_quote_to_invoice) → backward-compat total.
create or replace function public._public_quote_respond(_token text, _decision text, _note text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare _hash text; _a record; _q record; _prev text; _cid uuid := gen_random_uuid(); _so uuid; _sonum text;
begin
  _prev := current_setting('request.jwt.claims', true);
  if _decision not in ('accepted', 'rejected') then return jsonb_build_object('status', 'bad_decision'); end if;
  _hash := encode(digest(_token, 'sha256'), 'hex');
  if public._public_rate_hit(_hash) > 30 then return jsonb_build_object('status', 'rate_limited'); end if;

  select * into _a from public.quote_approvals where token_hash = _hash;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  if _a.expires_at <= now() then return jsonb_build_object('status', 'expired'); end if;
  if _a.responded_at is not null then return jsonb_build_object('status', 'already_responded'); end if;

  select q.id, q.tenant_id, q.created_by, q.customer_id, t.display_name, t.contact_phone,
         coalesce(t.fulfillment_enabled, false) as fulfill
    into _q from public.quotes q join public.tenants t on t.id = q.tenant_id where q.id = _a.quote_id;

  update public.quote_approvals set response = _decision, responded_at = now(),
         client_response_note = nullif(trim(coalesce(_note, '')), '') where id = _a.id;

  perform set_config('request.jwt.claims',
    (jsonb_build_object('user_role', 'ceo', 'tenant_id', _q.tenant_id::text)
     || case when _q.created_by is not null then jsonb_build_object('sub', _q.created_by::text) else '{}'::jsonb end)::text, true);

  if _decision = 'accepted' then
    update public.quotes set status = 'accepted', responded_at = now() where id = _q.id;
    if _q.fulfill and _q.customer_id is not null then
      _so := public.create_sales_order_from_quote(_q.id);          -- flujo fulfillment: SO en vez de factura
      update public.quotes set status = 'converted' where id = _q.id;
      select order_number into _sonum from public.sales_orders where id = _so;
      perform public._notify_sales(_q.tenant_id, 'sales_from_quote',
        coalesce(_sonum, 'SO') || ' creada', 'Cotización aceptada → orden de venta', _so, 'sales_order');
    else
      perform public.convert_quote_to_invoice(_q.id);               -- flujo original: factura draft
    end if;
  else
    update public.quotes set status = 'rejected', responded_at = now() where id = _q.id;
  end if;

  perform set_config('request.jwt.claims', coalesce(_prev, '{}'), true);
  return jsonb_build_object('status', 'ok', 'decision', _decision,
    'tenant_display_name', _q.display_name, 'tenant_contact_phone', _q.contact_phone);
exception when others then
  perform set_config('request.jwt.claims', coalesce(_prev, '{}'), true);
  raise warning '_public_quote_respond [%] sqlstate=% msg=% token_hash=%', _cid, sqlstate, sqlerrm, _hash;
  return jsonb_build_object('status', 'error');
end $function$;
