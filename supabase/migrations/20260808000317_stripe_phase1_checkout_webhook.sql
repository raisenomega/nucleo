-- ============================================================================
-- STRIPE-2 (Fase 1) · Cobro real: sync catálogo + checkout + webhook-processing + superadmin.
--   Stripe API vía extensión http (form-urlencoded). Secret keys desde Vault.
--   Webhook: la Edge Function (supabase/functions/stripe-webhook) valida firma e inserta el
--   evento; ESTAS RPCs procesan (service_role). record_invoice_payment gatea por permiso de
--   staff → el procesamiento IMPERSONA al CEO del tenant para reusarla (GL/income/notify).
--   INERTE hasta que un tenant tenga stripe_enabled=true. GOTCHA grants: por función.
-- ============================================================================

-- Helper: percent-encoding byte a byte (para el body form-urlencoded a Stripe).
create or replace function public._urlencode(_s text)
 returns text language sql immutable as $fn$
  select coalesce(string_agg(
    case when b between 48 and 57 or b between 65 and 90 or b between 97 and 122 or b in (45,46,95,126)
      then chr(b) else '%'||upper(lpad(to_hex(b),2,'0')) end, ''), '')
  from (select get_byte(convert_to(coalesce(_s,''),'UTF8'), gs) b
        from generate_series(0, length(convert_to(coalesce(_s,''),'UTF8'))-1) gs) x;
$fn$;

-- ── TAREA 2a · create_stripe_checkout_session (anon; factura u orden por token) ─
create or replace function public.create_stripe_checkout_session(p_invoice_token text default null, p_order_token text default null)
 returns jsonb language plpgsql security definer set search_path to 'public','vault','extensions'
as $fn$
declare _tid uuid; _amount numeric; _email text; _label text; _meta_key text; _meta_val text; _domain text;
  _sk text; _name text; _st int; _resp text; _body text;
begin
  if p_invoice_token is not null then
    select tenant_id, coalesce(balance,total), email, 'Factura '||coalesce(invoice_number,''), id::text
      into _tid, _amount, _email, _label, _meta_val from public.invoices where public_token = p_invoice_token;
    _meta_key := 'invoice_id';
  elsif p_order_token is not null then
    select tenant_id, total, customer_email, 'Orden '||coalesce(order_number,''), id::text
      into _tid, _amount, _email, _label, _meta_val from public.tenant_landing_orders where public_token = p_order_token;
    _meta_key := 'order_id';
  end if;
  if _tid is null then return jsonb_build_object('error','not_found'); end if;
  if coalesce(_amount,0) <= 0 then return jsonb_build_object('error','nothing_to_pay'); end if;
  select stripe_secret_vault_name into _name from public.tenant_payment_config where tenant_id=_tid and stripe_enabled;
  if _name is null then return jsonb_build_object('error','stripe_not_enabled'); end if;
  select decrypted_secret into _sk from vault.decrypted_secrets where name=_name limit 1;
  if _sk is null then return jsonb_build_object('error','no_secret'); end if;
  select coalesce(primary_domain, allowed_origins->>0, 'nucleoraisen.com') into _domain from public.tenants where id=_tid;
  _domain := regexp_replace(_domain, '^https?://', '');
  _body := 'mode=payment&payment_method_types[0]=card'
    ||'&line_items[0][quantity]=1&line_items[0][price_data][currency]=usd'
    ||'&line_items[0][price_data][unit_amount]='||round(_amount*100)::bigint
    ||'&line_items[0][price_data][product_data][name]='||public._urlencode(_label)
    ||'&success_url='||public._urlencode('https://'||_domain||'/'||(case when _meta_key='invoice_id' then 'factura' else 'orden' end)||'/'||coalesce(p_invoice_token,p_order_token)||'?paid=1')
    ||'&cancel_url='||public._urlencode('https://'||_domain||'/'||(case when _meta_key='invoice_id' then 'factura' else 'orden' end)||'/'||coalesce(p_invoice_token,p_order_token))
    ||'&metadata['||_meta_key||']='||_meta_val||'&metadata[tenant_id]='||_tid::text
    ||case when coalesce(_email,'')<>'' then '&customer_email='||public._urlencode(_email) else '' end;
  begin
    perform http_set_curlopt('CURLOPT_TIMEOUT_MS','9000');
    select status, content into _st, _resp from http(('POST','https://api.stripe.com/v1/checkout/sessions',
      array[http_header('Authorization','Bearer '||_sk)], 'application/x-www-form-urlencoded', _body)::http_request);
  exception when others then return jsonb_build_object('error','stripe_unreachable','detail',sqlerrm); end;
  if _st = 200 then return jsonb_build_object('checkout_url', (_resp::jsonb)->>'url', 'session_id', (_resp::jsonb)->>'id');
  else return jsonb_build_object('error','stripe_rejected','detail', coalesce((_resp::jsonb)->'error'->>'message','HTTP '||_st)); end if;
end $fn$;

-- ── Opciones de pago para la factura pública (anon) — para mostrar el botón ──
create or replace function public.public_invoice_pay_options(p_token text)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $fn$
declare _tid uuid; _bal numeric; _en boolean; _pk text;
begin
  select tenant_id, coalesce(balance,total) into _tid, _bal from public.invoices where public_token=p_token;
  if _tid is null then return jsonb_build_object('stripeEnabled', false); end if;
  select stripe_enabled, stripe_publishable_key into _en, _pk from public.tenant_payment_config where tenant_id=_tid;
  return jsonb_build_object('stripeEnabled', coalesce(_en,false), 'balance', _bal, 'publishableKey', _pk);
end $fn$;

-- ── TAREA 3b · secrets del tenant para la Edge Function (service_role only) ──
create or replace function public.get_stripe_secrets_for_webhook(p_tenant_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public','vault'
as $fn$
declare _skn text; _whn text; _sk text; _wh text;
begin
  select stripe_secret_vault_name, stripe_webhook_vault_name into _skn, _whn from public.tenant_payment_config where tenant_id=p_tenant_id;
  select decrypted_secret into _sk from vault.decrypted_secrets where name=_skn limit 1;
  select decrypted_secret into _wh from vault.decrypted_secrets where name=_whn limit 1;
  insert into public.audit_log(tenant_id, action, entity_type, entity_id, risk_level)
    values(p_tenant_id, 'stripe_webhook_secrets_access', 'tenant_payment_config', p_tenant_id, 'high');
  return jsonb_build_object('secret_key', _sk, 'webhook_secret', _wh);
end $fn$;

-- ── TAREA 3c · procesar checkout completado (service_role, vía impersonación CEO) ─
create or replace function public.process_checkout_completed(p_tenant_id uuid, p_session jsonb)
 returns void language plpgsql security definer set search_path to 'public'
as $fn$
declare _iid uuid := nullif(p_session->'metadata'->>'invoice_id','')::uuid;
  _oid uuid := nullif(p_session->'metadata'->>'order_id','')::uuid;
  _amount numeric := coalesce((p_session->>'amount_total')::numeric,0)/100.0;
  _intent text := coalesce(p_session->>'payment_intent', p_session->>'id'); _ceo uuid;
begin
  if exists (select 1 from public.stripe_payments where stripe_payment_intent_id=_intent) then return; end if; -- idempotencia extra
  select user_id into _ceo from public.user_roles where tenant_id=p_tenant_id and role in ('ceo','coo','superadmin') order by role limit 1;
  if _iid is not null then
    perform set_config('request.jwt.claims', jsonb_build_object('sub',_ceo::text,'tenant_id',p_tenant_id::text,'user_role','ceo','role','authenticated')::text, true);
    begin perform public.record_invoice_payment(jsonb_build_object('invoice_id',_iid,'amount',_amount)); exception when others then null; end;
    perform set_config('request.jwt.claims','',true);
  elsif _oid is not null then
    update public.tenant_landing_orders set payment_status='paid', status='paid', paid_at=now(),
      stripe_checkout_session_id=p_session->>'id', stripe_payment_intent_id=_intent where id=_oid and tenant_id=p_tenant_id;
  end if;
  insert into public.stripe_payments(tenant_id, stripe_payment_intent_id, invoice_id, landing_order_id, amount, currency, status, payment_method_type, metadata)
    values(p_tenant_id, _intent, _iid, _oid, _amount, coalesce(p_session->>'currency','usd'), 'succeeded', 'card', p_session->'metadata')
  on conflict (stripe_payment_intent_id) do nothing;
  insert into public.notifications(tenant_id, user_id, kind, title, body, entity_type, entity_id)
    select p_tenant_id, ur.user_id, 'payment_received', 'Pago recibido (Stripe)',
      '$'||to_char(_amount,'FM999999990.00')||' cobrado con tarjeta', 'invoice', _iid
    from public.user_roles ur where ur.tenant_id=p_tenant_id and ur.role in ('ceo','coo','superadmin');
end $fn$;

-- ── TAREA 3d · procesar refund ──────────────────────────────────────────────
create or replace function public.process_refund(p_tenant_id uuid, p_charge jsonb)
 returns void language plpgsql security definer set search_path to 'public'
as $fn$
declare _intent text := p_charge->>'payment_intent';
begin
  update public.stripe_payments set status='refunded', stripe_charge_id=p_charge->>'id', updated_at=now()
    where stripe_payment_intent_id=_intent and tenant_id=p_tenant_id;
  insert into public.notifications(tenant_id, user_id, kind, title, body, entity_type, entity_id)
    select p_tenant_id, ur.user_id, 'payment_received', 'Reembolso Stripe', 'Se reembolsó un pago con tarjeta', 'invoice', null
    from public.user_roles ur where ur.tenant_id=p_tenant_id and ur.role in ('ceo','coo','superadmin');
  insert into public.guardian_events(tenant_id, event_type, severity, metadata)
    values(p_tenant_id, 'suspicious_activity', 'warning', jsonb_build_object('summary','Refund de Stripe','payment_intent',_intent));
end $fn$;

-- ── TAREA 1b · sync catálogo → Stripe (CEO+) ────────────────────────────────
create or replace function public.sync_catalog_to_stripe()
 returns jsonb language plpgsql security definer set search_path to 'public','vault','extensions'
as $fn$
declare _t uuid := current_tenant(); _name text; _sk text; _created int := 0; _errs jsonb := '[]'::jsonb;
  r record; _st int; _resp text; _prod text; _price text;
begin
  if not is_ceo_or_above() then raise exception 'No autorizado' using errcode='42501'; end if;
  select stripe_secret_vault_name into _name from public.tenant_payment_config where tenant_id=_t and stripe_enabled;
  if _name is null then return jsonb_build_object('error','stripe_not_enabled'); end if;
  select decrypted_secret into _sk from vault.decrypted_secrets where name=_name limit 1;
  update public.tenant_payment_config set catalog_sync_status='syncing', updated_at=now() where tenant_id=_t;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','9000');
  for r in (select id, name, coalesce(unit_cost,0) price, 'inventory' src from public.inventory_items where tenant_id=_t
            union all select id, name, coalesce(price,0), 'landing' from public.tenant_landing_products where tenant_id=_t and is_published) loop
    if exists (select 1 from public.stripe_product_map where tenant_id=_t and (inventory_item_id=r.id or landing_product_id=r.id)) then continue; end if;
    if coalesce(r.price,0) <= 0 then continue; end if;
    begin
      select status, content into _st, _resp from http(('POST','https://api.stripe.com/v1/products',
        array[http_header('Authorization','Bearer '||_sk)], 'application/x-www-form-urlencoded', 'name='||public._urlencode(r.name))::http_request);
      if _st <> 200 then _errs := _errs || jsonb_build_object('item',r.name,'error',_resp); continue; end if;
      _prod := (_resp::jsonb)->>'id';
      select status, content into _st, _resp from http(('POST','https://api.stripe.com/v1/prices',
        array[http_header('Authorization','Bearer '||_sk)], 'application/x-www-form-urlencoded',
        'product='||_prod||'&currency=usd&unit_amount='||round(r.price*100)::bigint)::http_request);
      if _st <> 200 then _errs := _errs || jsonb_build_object('item',r.name,'error',_resp); continue; end if;
      _price := (_resp::jsonb)->>'id';
      insert into public.stripe_product_map(tenant_id, inventory_item_id, landing_product_id, stripe_product_id, stripe_price_id)
        values(_t, case when r.src='inventory' then r.id end, case when r.src='landing' then r.id end, _prod, _price);
      _created := _created + 1;
    exception when others then _errs := _errs || jsonb_build_object('item',r.name,'error',sqlerrm); end;
  end loop;
  update public.tenant_payment_config set catalog_last_synced_at=now(),
    catalog_sync_status=case when jsonb_array_length(_errs)=0 then 'completed' else 'failed' end,
    catalog_sync_error=nullif(_errs::text,'[]'), updated_at=now() where tenant_id=_t;
  return jsonb_build_object('created', _created, 'errors', _errs);
end $fn$;

-- ── TAREA 4b · resumen de pagos por tenant (superadmin) ─────────────────────
create or replace function public.get_platform_payments_summary()
 returns jsonb language plpgsql security definer set search_path to 'public'
as $fn$
begin
  if not is_superadmin() then raise exception 'No autorizado' using errcode='42501'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x."total30d" desc),'[]'::jsonb) from (
    select coalesce(t.display_name,t.legal_name,t.slug) as "tenant", c.stripe_enabled as "enabled",
      case when c.stripe_test_mode then 'TEST' else 'LIVE' end as "mode", c.catalog_last_synced_at as "lastSync",
      (select count(*) from public.stripe_payments p where p.tenant_id=t.id and p.status='succeeded' and p.created_at>now()-interval '30 days') as "tx30d",
      (select coalesce(sum(p.amount),0) from public.stripe_payments p where p.tenant_id=t.id and p.status='succeeded' and p.created_at>now()-interval '30 days') as "total30d"
    from public.tenants t left join public.tenant_payment_config c on c.tenant_id=t.id
    where coalesce(c.stripe_enabled,false) or exists (select 1 from public.stripe_payments p where p.tenant_id=t.id)) x);
end $fn$;

-- ── Grants ──────────────────────────────────────────────────────────────────
revoke execute on function public._urlencode(text) from public, anon;
grant  execute on function public.create_stripe_checkout_session(text,text) to anon, authenticated;
grant  execute on function public.public_invoice_pay_options(text) to anon, authenticated;
revoke execute on function public.get_stripe_secrets_for_webhook(uuid) from public, anon, authenticated;  -- solo service_role
revoke execute on function public.process_checkout_completed(uuid,jsonb) from public, anon, authenticated;
revoke execute on function public.process_refund(uuid,jsonb) from public, anon, authenticated;
revoke execute on function public.sync_catalog_to_stripe() from public, anon;
grant  execute on function public.sync_catalog_to_stripe() to authenticated;
revoke execute on function public.get_platform_payments_summary() from public, anon;
grant  execute on function public.get_platform_payments_summary() to authenticated;
