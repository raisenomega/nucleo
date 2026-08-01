-- MIGR 345 — Bug B (trazabilidad money-critical): items[].qty decía 1 aunque el cliente pagara 2-4 unidades.
-- items[] es la FUENTE DE VERDAD de 5 puntos de contacto (web /orden/$token, PDF, email de confirmación, panel
-- staff y futuras integraciones). El frontend hardcodea qty:1 (OrderModal.tsx:35) y NO conoce las reglas de
-- pricing (white-label) → el fix es 100% server-side (Opción A2). NO se toca el frontend ni la firma del RPC.
-- (a) _public_price_order: expone `breakdown.addon_lines` (ADITIVO — no altera ningún cálculo ni el total).
-- (b) _public_create_order: reconstruye items[] antes del INSERT →
--     · qty efectivo desde el step `field_tiered`, con GUARD NUMÉRICO (evaluationType='individual' no aplica);
--     · add-ons (extraLids/extraRegularBins/additionalUnits/hydroJet) como líneas propias con kind='addon';
--     · `price` explícito en TODAS las líneas. Sin esto los totales no cuadrarían: el renderer reparte el
--       subtotal proporcionalmente por qty cuando falta price → invariante Σ(price×qty) == subtotal.
--     · id=null en las líneas de add-on (no son entidades con uuid) para no romper los cast ::uuid de items[0].
-- (c) Backfill de las 4 órdenes DACO-afectadas (#61, #37, #36, #10) desde el pricing_breakdown ya persistido.
CREATE OR REPLACE FUNCTION public._public_price_order(_t uuid, _items jsonb, _cf jsonb, _coupon text, _is_first_cycle boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare _base numeric := 0; _addons numeric := 0; _sub numeric := 0; _tax numeric := 0; _ship numeric := 0; _disc numeric := 0; _stdisc numeric := 0; _taxpct numeric;
        _it jsonb; _kind text; _iid uuid; _qty numeric; _p numeric; _mrule jsonb; _mri uuid; _arule jsonb; _trule jsonb; _promo jsonb; _c record;
        _freq text := nullif(_cf->>'frequency',''); _fi int; _bi int; _bins int; _steps jsonb := '[]'::jsonb; _tier numeric; _fval text;
        _m1 jsonb; _uprice numeric; _grand numeric; _alines jsonb := '[]'::jsonb; _svc uuid;  -- _svc: servicio del pedido (para addon prices per_service)
begin
  select config, applies_to_id into _mrule, _mri from public.tenant_pricing_rules where tenant_id=_t and rule_type='matrix_2d' and is_active limit 1;
  select config into _arule from public.tenant_pricing_rules where tenant_id=_t and rule_type='flat' and config->>'kind'='addons' and is_active limit 1;
  select config into _trule from public.tenant_pricing_rules where tenant_id=_t and rule_type='tiered_qty' and is_active and config ? 'field' and _cf ? (config->>'field') limit 1;
  for _it in select value from jsonb_array_elements(coalesce(_items,'[]'::jsonb)) loop
    _kind := _it->>'kind'; _iid := nullif(_it->>'id','')::uuid; _qty := coalesce(nullif(_it->>'qty','')::numeric,1); _p := 0;
    if _kind='service' then _svc := _iid; end if;
    if _kind='service' and _trule is not null then
      _fval := _cf->>(_trule->>'field');
      select (tt->>'price')::numeric into _tier from jsonb_array_elements(_trule->'tiers') tt where tt->>'value'=_fval limit 1;
      _p := coalesce(_tier, 0);
      _steps := _steps || jsonb_build_object('rule','field_tiered','field',_trule->>'field','value',_fval,'price',_p);
    elsif _kind='service' and _freq is not null and _mrule is not null and _cf ? (_mrule->'axis_y'->>'field') and (_mri is null or _mri=_iid) then
      _bins := coalesce(nullif(_cf->>'extraBuriedBins','')::int,0);
      _fi := array_position(array(select jsonb_array_elements_text(_mrule->'axis_x'->'values')),_freq)-1;
      _bi := array_position(array(select jsonb_array_elements_text(_mrule->'axis_y'->'values')),_bins::text)-1;
      if _fi>=0 and _bi>=0 then _p := (_mrule->'matrix'->_fi->>_bi)::numeric; end if;
    elsif _kind='product' then select price into _p from public.tenant_landing_products where id=_iid and tenant_id=_t;
    elsif _kind='service' then
      select config into _m1 from public.tenant_pricing_rules where tenant_id=_t and rule_type='matrix_1d' and is_active and applies_to_id=_iid limit 1;
      if _m1 is not null then
        select (tt->>'price')::numeric, (tt->>'unit_price')::numeric into _p, _uprice from jsonb_array_elements(_m1->'tiers') tt where tt->>'value'=nullif(_cf->>(_m1->>'field_name'),'') limit 1;
        _p := coalesce(_p,0);
        if _p=0 then select price into _p from public.tenant_landing_services where id=_iid and tenant_id=_t; _p := coalesce(_p,0); end if;
        _steps := _steps || jsonb_build_object('rule','matrix_1d','value',_cf->>(_m1->>'field_name'),'price',_p,'unit_price',_uprice,'unit_label_es',_m1->>'unit_label_es','unit_label_en',_m1->>'unit_label_en');
      else select price into _p from public.tenant_landing_services where id=_iid and tenant_id=_t; end if;
    elsif _kind='package' then select price into _p from public.tenant_landing_packages where id=_iid and tenant_id=_t;
    end if;
    _base := _base + coalesce(_p,0)*_qty;
  end loop;
  if _arule is not null then
    -- addon price per_service[_svc][key] (Rodaja 1.5) con fallback al valor tenant-wide config[key].
    _addons := coalesce(nullif(_cf->>'extraLids','')::numeric,0)*coalesce((_arule->'per_service'->_svc::text->>'extraLids')::numeric,(_arule->>'extraLids')::numeric,0)
      + coalesce(nullif(_cf->>'extraRegularBins','')::numeric,0)*coalesce((_arule->'per_service'->_svc::text->>'extraRegularBins')::numeric,(_arule->>'extraRegularBins')::numeric,0)
      + coalesce(nullif(_cf->>'additionalUnits','')::numeric,0)*coalesce((_arule->'per_service'->_svc::text->>'additionalUnits')::numeric,(_arule->>'additionalUnits')::numeric,0)
      + case when coalesce((_cf->>'hydroJet')::boolean,false) then coalesce((_arule->'per_service'->_svc::text->>'hydroJet')::numeric,(_arule->>'hydroJet')::numeric,0) else 0 end;
    -- (Bug B) desglose de add-ons para persistirlos como line-items. Mismos precios que la suma de arriba
    -- (per_service -> tenant-wide); solo los que generan cargo real (qty>0 y precio>0). ADITIVO: no altera _addons.
    select coalesce(jsonb_agg(jsonb_build_object('field',k,'qty',q,'price',pr) order by k),'[]'::jsonb) into _alines
    from (values
      ('extraLids', coalesce(nullif(_cf->>'extraLids','')::numeric,0), coalesce((_arule->'per_service'->_svc::text->>'extraLids')::numeric,(_arule->>'extraLids')::numeric,0)),
      ('extraRegularBins', coalesce(nullif(_cf->>'extraRegularBins','')::numeric,0), coalesce((_arule->'per_service'->_svc::text->>'extraRegularBins')::numeric,(_arule->>'extraRegularBins')::numeric,0)),
      ('additionalUnits', coalesce(nullif(_cf->>'additionalUnits','')::numeric,0), coalesce((_arule->'per_service'->_svc::text->>'additionalUnits')::numeric,(_arule->>'additionalUnits')::numeric,0)),
      ('hydroJet', case when coalesce((_cf->>'hydroJet')::boolean,false) then 1 else 0 end, coalesce((_arule->'per_service'->_svc::text->>'hydroJet')::numeric,(_arule->>'hydroJet')::numeric,0))
    ) t(k,q,pr) where q > 0 and pr > 0;
  end if;
  _sub := _base;
  if coalesce(_coupon,'')<>'' then
    select config into _promo from public.tenant_pricing_rules where tenant_id=_t and rule_type='coupon' and config->>'code'=_coupon and is_active limit 1;
    if _promo is not null then
      -- Promo = OVERRIDE de la suscripción (solo primer ciclo). El recurrente usa la matriz normal. Los addons SUMAN encima.
      if _is_first_cycle then _sub := coalesce((_promo->>'first_cycle_price')::numeric, _base); end if;
      _disc := greatest(_base - _sub, 0);
      _steps := _steps || jsonb_build_object('rule','coupon','code',_coupon,'type',case when _is_first_cycle then 'first_cycle' else 'recurring' end,'discount',_disc);
    else
      select * into _c from public.tenant_coupons where tenant_id=_t and code=_coupon and is_active and (expires_at is null or expires_at>now()) and (max_uses is null or current_uses<max_uses) limit 1;
      if found then _stdisc := case when _c.discount_type='percentage' then round((_base+_addons)*_c.value/100.0,2) else least(_c.value,_base+_addons) end; end if;
    end if;
  end if;
  _grand := _sub + _addons;
  select (config->>'percentage')::numeric into _taxpct from public.tenant_pricing_rules where tenant_id=_t and rule_type='tax' and is_active order by priority desc limit 1;
  _tax := round(_grand*coalesce(_taxpct,0)/100.0,2);
  select coalesce((config->>'amount')::numeric,0) into _ship from public.tenant_pricing_rules where tenant_id=_t and rule_type='shipping' and is_active order by priority desc limit 1;
  _ship := coalesce(_ship,0);
  return jsonb_build_object('subtotal',round(_base+_addons,2),'tax',_tax,'shipping',_ship,'discount',round(greatest(_disc,_stdisc),2),
    'total',round(_grand+_tax+_ship-_stdisc,2),
    'breakdown',jsonb_build_object('steps',_steps,'tax_pct',coalesce(_taxpct,0),'coupon_applied',(_disc>0 or _stdisc>0),'matrix_used',_freq is not null,'addon_lines',_alines));
end $function$
;

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
        _qty_eff int; _alines jsonb; _add_tot numeric := 0; _base_tot numeric := 0;
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
  -- (Bug B) items[] es la fuente de verdad de los 5 puntos de contacto (web, PDF, email, panel staff, futuros).
  -- (a) qty EFECTIVO desde el step field_tiered, con guard numérico: evaluationType='individual' NO aplica.
  select (st->>'value')::int into _qty_eff from jsonb_array_elements(_calc->'breakdown'->'steps') st
   where st->>'rule' = 'field_tiered' and st->>'value' ~ '^[0-9]+$' limit 1;
  -- (b) add-ons como líneas propias + price EXPLÍCITO en todas (incl. el principal): el renderer reparte el
  -- subtotal de forma proporcional cuando falta price, así que sin esto los totales dejarían de cuadrar.
  _alines := coalesce(_calc->'breakdown'->'addon_lines','[]'::jsonb);
  select coalesce(sum((l->>'qty')::numeric * (l->>'price')::numeric),0) into _add_tot from jsonb_array_elements(_alines) l;
  _base_tot := (_calc->>'subtotal')::numeric - _add_tot;
  select jsonb_agg(li order by ord) into _items from (
    select 0 as ord, jsonb_build_object('id', it->>'id', 'kind', it->>'kind', 'name', it->>'name',
             'qty', coalesce(_qty_eff, nullif(it->>'qty','')::int, 1),
             'price', round(_base_tot / greatest(coalesce(_qty_eff, nullif(it->>'qty','')::int, 1),1), 2)) as li
      from jsonb_array_elements(_items) with ordinality t(it,i) where i = 1
    union all
    select 1, jsonb_build_object('id', null, 'kind', 'addon', 'field', l->>'field',
             'name', coalesce((select f.label_es from public.tenant_order_form_fields f
                               where f.form_id = _form.id and f.field_key = l->>'field' limit 1), l->>'field'),
             'qty', (l->>'qty')::int, 'price', (l->>'price')::numeric)
      from jsonb_array_elements(_alines) l
  ) q;
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

-- (c) BACKFILL: solo órdenes con step field_tiered NUMÉRICO y qty=1 mal persistido.
update public.tenant_landing_orders o
set items = jsonb_set(o.items, '{0,qty}', to_jsonb(sub.qty_real))
from (
  select o2.id, (st->>'value')::int as qty_real
  from public.tenant_landing_orders o2,
       lateral jsonb_array_elements(o2.pricing_breakdown->'breakdown'->'steps') st
  where st->>'rule' = 'field_tiered' and st->>'value' ~ '^[0-9]+$'
    and coalesce(o2.items->0->>'qty','1') = '1' and (st->>'value')::int > 1
) sub
where o.id = sub.id;
