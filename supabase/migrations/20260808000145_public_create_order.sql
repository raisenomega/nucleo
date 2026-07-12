-- Migración 145: _public_create_order (RPC pública anon) + pricing server-side autoritativo + email confirmación cliente.
-- Cierra loop landing→orden→panel. Sin gateways (offline default). Convención (_hostname,_payload,_client_ip) como _public_create_lead.
-- Correcciones: confirmation_email_sent_at no existía en orders → se agrega; anti-tamper real = server recomputa precio (no confía en cliente).

alter table public.tenant_landing_orders add column if not exists confirmation_email_sent_at timestamptz;

-- 1) Autoridad de precio server-side: catálogo + matriz(freq×bins) + addons + tax/shipping/coupon. Anti-tamper.
create or replace function public._public_price_order(_t uuid, _items jsonb, _cf jsonb, _coupon text)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $fn$
declare _base numeric := 0; _tax numeric := 0; _ship numeric := 0; _disc numeric := 0; _taxpct numeric;
        _it jsonb; _kind text; _iid uuid; _qty numeric; _p numeric; _mrule jsonb; _arule jsonb; _c record;
        _freq text := nullif(_cf->>'frequency',''); _fi int; _bi int; _bins int;
begin
  select config into _mrule from public.tenant_pricing_rules where tenant_id=_t and rule_type='matrix_2d' and is_active limit 1;
  select config into _arule from public.tenant_pricing_rules where tenant_id=_t and rule_type='flat' and config->>'kind'='addons' and is_active limit 1;
  for _it in select value from jsonb_array_elements(coalesce(_items,'[]'::jsonb)) loop
    _kind := _it->>'kind'; _iid := nullif(_it->>'id','')::uuid; _qty := coalesce(nullif(_it->>'qty','')::numeric, 1); _p := 0;
    if _kind='service' and _freq is not null and _mrule is not null then
      _bins := coalesce(nullif(_cf->>'extraBuriedBins','')::int, 0);
      _fi := array_position(array(select jsonb_array_elements_text(_mrule->'axis_x'->'values')), _freq) - 1;
      _bi := array_position(array(select jsonb_array_elements_text(_mrule->'axis_y'->'values')), _bins::text) - 1;
      if _fi >= 0 and _bi >= 0 then _p := (_mrule->'matrix'->_fi->>_bi)::numeric; end if;
    elsif _kind='product' then select price into _p from public.tenant_landing_products where id=_iid and tenant_id=_t;
    elsif _kind='service' then select price into _p from public.tenant_landing_services where id=_iid and tenant_id=_t;
    elsif _kind='package' then select price into _p from public.tenant_landing_packages where id=_iid and tenant_id=_t;
    end if;
    _base := _base + coalesce(_p, 0) * _qty;
  end loop;
  if _arule is not null then
    _base := _base + coalesce(nullif(_cf->>'extraLids','')::numeric,0) * coalesce((_arule->>'extraLids')::numeric,0)
      + coalesce(nullif(_cf->>'extraRegularBins','')::numeric,0) * coalesce((_arule->>'extraRegularBins')::numeric,0)
      + case when coalesce((_cf->>'hydroJet')::boolean, false) then coalesce((_arule->>'hydroJet')::numeric,0) else 0 end;
  end if;
  select (config->>'percentage')::numeric into _taxpct from public.tenant_pricing_rules where tenant_id=_t and rule_type='tax' and is_active order by priority desc limit 1;
  _tax := round(_base * coalesce(_taxpct,0)/100.0, 2);
  select coalesce((config->>'amount')::numeric,0) into _ship from public.tenant_pricing_rules where tenant_id=_t and rule_type='shipping' and is_active order by priority desc limit 1;
  _ship := coalesce(_ship, 0);
  if coalesce(_coupon,'') <> '' then
    select * into _c from public.tenant_coupons where tenant_id=_t and code=_coupon and is_active and (expires_at is null or expires_at>now()) and (max_uses is null or current_uses<max_uses) limit 1;
    if found then _disc := case when _c.discount_type='percentage' then round(_base*_c.value/100.0,2) else least(_c.value,_base) end; end if;
  end if;
  return jsonb_build_object('subtotal',round(_base,2),'tax',_tax,'shipping',_ship,'discount',_disc,
    'total',round(_base+_tax+_ship-_disc,2),
    'breakdown',jsonb_build_object('tax_pct',coalesce(_taxpct,0),'coupon_applied',_disc>0,'matrix_used',_freq is not null and _mrule is not null));
end $fn$;

-- 2) Email de confirmación al cliente (http+Resend, white-label, idempotente por flag). Instrucciones según método.
create or replace function public._send_order_confirmation_email(_order_id uuid)
returns void language plpgsql security definer set search_path to 'public', 'extensions' as $fn$
declare _o public.tenant_landing_orders%rowtype; _key text; _name text; _instr text; _items text := ''; _it jsonb; _html text; _status int; _resp text;
begin
  select * into _o from public.tenant_landing_orders where id = _order_id;
  if _o.confirmation_email_sent_at is not null or coalesce(_o.customer_email,'') = '' then return; end if;
  select coalesce(nullif(trim(t.display_name),''), t.legal_name, 'NÚCLEO') into _name from public.tenants t where t.id=_o.tenant_id;
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _key is null then raise warning '_send_order_confirmation_email sin key order=%', _order_id; return; end if;
  _instr := case _o.payment_method_key
    when 'offline_coordination' then 'Un representante te contactará en menos de 24 horas para coordinar el pago vía WhatsApp.'
    when 'cash_on_delivery' then 'Prepará el pago en efectivo para el momento de la entrega.'
    else 'Coordinaremos el pago contigo pronto.' end;
  for _it in select value from jsonb_array_elements(coalesce(_o.items,'[]'::jsonb)) loop
    _items := _items || '<li>' || public._html_escape(coalesce(_it->>'name','Ítem')) || ' × ' || coalesce(_it->>'qty','1') || '</li>';
  end loop;
  _html := '<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111827">'
    || '<h2 style="color:#16a34a">¡Orden recibida! ' || public._html_escape(coalesce(_o.order_number,'')) || '</h2>'
    || '<p>Hola ' || public._html_escape(coalesce(_o.customer_name,'Cliente')) || ', hemos recibido tu orden.</p>'
    || '<ul>' || _items || '</ul>'
    || '<p style="font-size:18px;font-weight:bold">Total: $' || to_char(_o.total,'FM999990.00') || ' ' || coalesce(_o.currency,'USD') || '</p>'
    || '<p style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">' || _instr || '</p>'
    || '<p style="font-size:12px;color:#9ca3af">' || public._html_escape(_name) || '</p></div>';
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)], 'application/json',
    jsonb_build_object('from',_name||' <noreply@raisen.agency>','to',_o.customer_email,
      'subject','Orden recibida · '||coalesce(_o.order_number,''),'html',_html)::text)::http_request);
  if _status between 200 and 299 then update public.tenant_landing_orders set confirmation_email_sent_at=now() where id=_order_id;
  else raise warning '_send_order_confirmation_email non-2xx=% order=%', _status, _order_id; end if;
exception when others then raise warning '_send_order_confirmation_email EXCEPTION % order=%', sqlerrm, _order_id;
end $fn$;
revoke execute on function public._send_order_confirmation_email(uuid) from public, anon, authenticated;

-- 3) Extiende el trigger AFTER INSERT (notif Roy ya existe) → + email cliente
create or replace function public._on_order_insert()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
begin
  perform public._notify_order_created(new.id);
  perform public._send_order_confirmation_email(new.id);
  return new;
end $fn$;

-- 4) RPC pública: crea orden pending (offline). Rate limit + validación + revalidación anti-tamper + idempotencia.
create or replace function public._public_create_order(_hostname text, _payload jsonb, _client_ip text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $fn$
declare _t uuid; _form record; _pm record; _valid jsonb; _calc jsonb; _idem uuid; _ex record;
        _items jsonb := coalesce(_payload->'items','[]'::jsonb); _cf jsonb := coalesce(_payload->'custom_fields','{}'::jsonb);
        _pmk text := _payload->>'payment_method_key'; _coupon text := nullif(_payload->>'coupon_code','');
        _ctotal numeric; _stotal numeric; _id uuid; _num text; _otype text; _freq text; _cid uuid; _nm text;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','invalid_origin'); end if;
  if not public._landing_rl('order:'||coalesce(_client_ip,'')||':'||coalesce(_hostname,''), 5) then
    return jsonb_build_object('status','error','code','rate_limited'); end if;
  select * into _form from public.tenant_order_forms where id=(_payload->>'form_id')::uuid and tenant_id=_t and is_active;
  if not found then return jsonb_build_object('status','error','code','form_invalid'); end if;
  _idem := nullif(_payload->>'idempotency_key','')::uuid;
  if _idem is not null then
    select id, order_number into _ex from public.tenant_landing_orders where idempotency_key=_idem and tenant_id=_t;
    if found then return jsonb_build_object('status','ok','order_number',_ex.order_number,'order_id',_ex.id,'idempotent',true); end if;
  end if;
  select * into _pm from public.tenant_payment_methods where tenant_id=_t and method_key=_pmk and is_active;
  if not found then return jsonb_build_object('status','error','code','payment_method_invalid'); end if;
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
  returning id into _id;
  if _coupon is not null then
    select id into _cid from public.tenant_coupons where tenant_id=_t and code=_coupon and is_active;
    if _cid is not null then insert into public.coupon_redemptions(tenant_id,coupon_id,order_id) values(_t,_cid,_id); end if;
  end if;
  return jsonb_build_object('status','ok','order_number',_num,'order_id',_id);
end $fn$;
grant execute on function public._public_create_order(text, jsonb, text) to anon, authenticated;
