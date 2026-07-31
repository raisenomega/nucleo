-- OFERTAS-HOOK-STRIPE 2b2.6 HOTFIX: _public_create_order insertaba audit_log risk_level='info' (inválido; el
-- CHECK solo permite low/medium/high/critical) → BLOQUEO TOTAL de checkout (23514). migr 338 lo re-introdujo
-- desde un source viejo (el fix a 'low' de 2b1 solo entró en migr 336). Fix: 'info'→'low' (evento compliance).
CREATE OR REPLACE FUNCTION public._public_create_order(_hostname text, _payload jsonb, _client_ip text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare _t uuid; _form record; _pm record; _valid jsonb; _calc jsonb; _idem uuid; _ex record;
        _items jsonb := coalesce(_payload->'items','[]'::jsonb); _cf jsonb := coalesce(_payload->'custom_fields','{}'::jsonb);
        _pmk text := _payload->>'payment_method_key'; _coupon text := nullif(_payload->>'coupon_code','');
        _offer_id uuid := nullif(_payload->>'offer_id','')::uuid; _terms text; _hdr jsonb;
        _ctotal numeric; _stotal numeric; _id uuid; _num text; _otype text; _freq text; _cid uuid; _nm text; _tok text;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','invalid_origin'); end if;
  _hdr := nullif(current_setting('request.headers', true),'')::jsonb;
  _client_ip := coalesce(nullif(_client_ip,''), split_part(_hdr->>'x-forwarded-for', ',', 1));
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
    subtotal,tax,shipping,discount,total,currency,idempotency_key,source_ip,source_hostname,user_agent,referrer,offer_id)
  values(_t,_num,'pending',_pmk,'unpaid',_otype,_freq,_form.id,_nm,_cf->>'email',_cf->>'phone',
    jsonb_build_object('address',_cf->>'address','unit',_cf->>'unit','city',_cf->>'city','state',_cf->>'state','zip',_cf->>'zip'),
    _items,_cf,_calc,(_calc->>'subtotal')::numeric,(_calc->>'tax')::numeric,(_calc->>'shipping')::numeric,(_calc->>'discount')::numeric,
    _stotal,'USD',_idem,_client_ip,_hostname,_payload->>'user_agent',_payload->>'referrer',_offer_id)
  returning id, public_token into _id, _tok;
  if _coupon is not null then
    select id into _cid from public.tenant_coupons where tenant_id=_t and code=_coupon and is_active;
    if _cid is not null then insert into public.coupon_redemptions(tenant_id,coupon_id,order_id) values(_t,_cid,_id); end if;
  end if;
  if _offer_id is not null then  -- firma digital de aceptación de términos (Ley 148-2004 PR)
    select coalesce(o.terms_es,'')||'|'||coalesce(o.terms_en,'') into _terms from public.tenant_landing_offers o where o.id=_offer_id and o.tenant_id=_t;
    insert into public.audit_log(tenant_id, action, entity_type, entity_id, ip_address, user_agent, new_values, risk_level)
    values(_t, 'subscription_terms_accepted', 'offer', _offer_id, _client_ip, _payload->>'user_agent',
      jsonb_build_object('order_id',_id,'customer_name',_nm,'customer_email',_cf->>'email',
        'terms_hash', encode(sha256(convert_to(coalesce(_terms,''),'UTF8')),'hex'), 'accepted_at', now()), 'low');
  end if;
  return jsonb_build_object('status','ok','order_number',_num,'order_id',_id,'public_token',_tok);
end $function$
;
