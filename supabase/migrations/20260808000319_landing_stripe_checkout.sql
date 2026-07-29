-- LANDING-CLEANUP Fase 1: checkout Stripe one-time en el landing público (reemplaza ATH/Efectivo
-- para tenants con Stripe). Reusa create_stripe_checkout_session (STRIPE-2, ya soporta p_order_token)
-- y el webhook checkout.session.completed -> process_checkout_completed (ya marca la orden pagada).
-- Backward-compat: tenants SIN Stripe mantienen los métodos legacy intactos.

-- (1) _public_create_order: aceptar payment_method_key='stripe' (marcador, sin fila en
-- tenant_payment_methods) cuando el tenant tiene Stripe activo, y DEVOLVER public_token para
-- que el frontend arme el checkout. Resto idéntico.
create or replace function public._public_create_order(_hostname text, _payload jsonb, _client_ip text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare _t uuid; _form record; _pm record; _valid jsonb; _calc jsonb; _idem uuid; _ex record;
        _items jsonb := coalesce(_payload->'items','[]'::jsonb); _cf jsonb := coalesce(_payload->'custom_fields','{}'::jsonb);
        _pmk text := _payload->>'payment_method_key'; _coupon text := nullif(_payload->>'coupon_code','');
        _ctotal numeric; _stotal numeric; _id uuid; _num text; _otype text; _freq text; _cid uuid; _nm text; _tok text;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','invalid_origin'); end if;
  if not public._landing_rl('order:'||coalesce(_client_ip,'')||':'||coalesce(_hostname,''), 5) then
    return jsonb_build_object('status','error','code','rate_limited'); end if;
  select * into _form from public.tenant_order_forms where id=(_payload->>'form_id')::uuid and tenant_id=_t and is_active;
  if not found then return jsonb_build_object('status','error','code','form_invalid'); end if;
  _idem := nullif(_payload->>'idempotency_key','')::uuid;
  if _idem is not null then
    select id, order_number, public_token into _ex from public.tenant_landing_orders where idempotency_key=_idem and tenant_id=_t;
    if found then return jsonb_build_object('status','ok','order_number',_ex.order_number,'order_id',_ex.id,'public_token',_ex.public_token,'idempotent',true); end if;
  end if;
  if _pmk = 'stripe' then
    if not exists (select 1 from public.tenant_payment_config where tenant_id=_t and stripe_enabled) then
      return jsonb_build_object('status','error','code','payment_method_invalid'); end if;
  else
    select * into _pm from public.tenant_payment_methods where tenant_id=_t and method_key=_pmk and is_active;
    if not found then return jsonb_build_object('status','error','code','payment_method_invalid'); end if;
  end if;
  _valid := public.validate_order_form_data(_form.id, _cf);
  if not (_valid->>'valid')::boolean then return jsonb_build_object('status','error','code','form_invalid','errors',_valid->'errors'); end if;
  if _coupon is not null and not exists (select 1 from public.tenant_coupons where tenant_id=_t and code=_coupon and is_active and (expires_at is null or expires_at>now()) and (max_uses is null or current_uses<max_uses)) then
    return jsonb_build_object('status','error','code','coupon_invalid'); end if;
  _calc := public._public_price_order(_t, _items, _cf, _coupon);
  _stotal := (_calc->>'total')::numeric;
  _ctotal := nullif(_payload->>'client_total','')::numeric;
  if _ctotal is not null and abs(_ctotal - _stotal) > 0.01 then
    insert into public.tenant_audit_log(tenant_id,entity_type,action,changes)
      values(_t,'order_total_mismatch','reject',jsonb_build_object('client',_ctotal,'server',_stotal,'ip',_client_ip,'items',_items));
    return jsonb_build_object('status','error','code','total_mismatch'); end if;
  _freq := nullif(_cf->>'frequency','');
  _otype := case when _freq is not null then 'subscription' else 'one_time' end;
  _nm := coalesce(nullif(trim(coalesce(_cf->>'name', trim(coalesce(_cf->>'firstName','')||' '||coalesce(_cf->>'lastName','')))),''),'Cliente web');
  _num := public.next_order_number(_t);
  insert into public.tenant_landing_orders(tenant_id,order_number,status,payment_method_key,payment_status,order_type,billing_frequency,form_id,
    customer_name,customer_email,customer_phone,customer_address,items,custom_fields,pricing_breakdown,
    subtotal,tax,shipping,discount,total,currency,idempotency_key,source_ip,source_hostname,user_agent,referrer)
  values(_t,_num,'pending',_pmk,'unpaid',_otype,_freq,_form.id,_nm,_cf->>'email',_cf->>'phone',
    jsonb_build_object('address',_cf->>'address','unit',_cf->>'unit','city',_cf->>'city','state',_cf->>'state','zip',_cf->>'zip'),
    _items,_cf,_calc,(_calc->>'subtotal')::numeric,(_calc->>'tax')::numeric,(_calc->>'shipping')::numeric,(_calc->>'discount')::numeric,
    _stotal,'USD',_idem,_client_ip,_hostname,_payload->>'user_agent',_payload->>'referrer')
  returning id, public_token into _id, _tok;
  if _coupon is not null then
    select id into _cid from public.tenant_coupons where tenant_id=_t and code=_coupon and is_active;
    if _cid is not null then insert into public.coupon_redemptions(tenant_id,coupon_id,order_id) values(_t,_cid,_id); end if;
  end if;
  return jsonb_build_object('status','ok','order_number',_num,'order_id',_id,'public_token',_tok);
end $function$;

-- (2) _on_order_insert: una orden Stripe pendiente NO debe mandar email de confirmación ni notificar
-- al staff en el INSERT (aún no se paga). Esas notificaciones se disparan al confirmarse el pago.
create or replace function public._on_order_insert()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  if new.payment_method_key = 'stripe' and coalesce(new.payment_status,'') <> 'paid' then
    return new;
  end if;
  perform public._notify_order_created(new.id);
  perform public._send_order_confirmation_email(new.id);
  return new;
end $function$;

-- (3) process_checkout_completed: al confirmarse el pago de una landing order, disparar las
-- notificaciones/email que se difirieron en el INSERT (solo la rama de orden). Idempotente por diseño.
create or replace function public.process_checkout_completed(p_tenant_id uuid, p_session jsonb)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _iid uuid := nullif(p_session->'metadata'->>'invoice_id','')::uuid;
  _oid uuid := nullif(p_session->'metadata'->>'order_id','')::uuid;
  _amount numeric := coalesce((p_session->>'amount_total')::numeric,0)/100.0;
  _intent text := coalesce(p_session->>'payment_intent', p_session->>'id'); _ceo uuid;
begin
  if exists (select 1 from public.stripe_payments where stripe_payment_intent_id=_intent) then return; end if;
  select user_id into _ceo from public.user_roles where tenant_id=p_tenant_id and role in ('ceo','coo','superadmin') order by role limit 1;
  if _iid is not null then
    perform set_config('request.jwt.claims', jsonb_build_object('sub',_ceo::text,'tenant_id',p_tenant_id::text,'user_role','ceo','role','authenticated')::text, true);
    begin perform public.record_invoice_payment(jsonb_build_object('invoice_id',_iid,'amount',_amount)); exception when others then null; end;
    perform set_config('request.jwt.claims','',true);
  elsif _oid is not null then
    update public.tenant_landing_orders set payment_status='paid', status='paid', paid_at=now(),
      stripe_checkout_session_id=p_session->>'id', stripe_payment_intent_id=_intent where id=_oid and tenant_id=p_tenant_id;
    perform public._notify_order_created(_oid);
    begin perform public._send_order_confirmation_email(_oid); exception when others then null; end;
  end if;
  insert into public.stripe_payments(tenant_id, stripe_payment_intent_id, invoice_id, landing_order_id, amount, currency, status, payment_method_type, metadata)
    values(p_tenant_id, _intent, _iid, _oid, _amount, coalesce(p_session->>'currency','usd'), 'succeeded', 'card', p_session->'metadata')
  on conflict (stripe_payment_intent_id) do nothing;
  insert into public.notifications(tenant_id, user_id, kind, title, body, entity_type, entity_id)
    select p_tenant_id, ur.user_id, 'payment_received', 'Pago recibido (Stripe)',
      '$'||to_char(_amount,'FM999999990.00')||' cobrado con tarjeta', 'invoice', _iid
    from public.user_roles ur where ur.tenant_id=p_tenant_id and ur.role in ('ceo','coo','superadmin');
end $function$;

-- (4) config de pago del landing por hostname (anon): el modal decide picker legacy vs botón Stripe.
create or replace function public._public_landing_pay_config(_hostname text)
 returns jsonb language plpgsql stable security definer set search_path to 'public'
as $function$
declare _t uuid; _en boolean; _pk text;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('stripeEnabled', false); end if;
  select stripe_enabled, stripe_publishable_key into _en, _pk from public.tenant_payment_config where tenant_id=_t;
  return jsonb_build_object('stripeEnabled', coalesce(_en,false), 'publishableKey', _pk);
end $function$;
revoke execute on function public._public_landing_pay_config(text) from public;
grant execute on function public._public_landing_pay_config(text) to anon, authenticated;
