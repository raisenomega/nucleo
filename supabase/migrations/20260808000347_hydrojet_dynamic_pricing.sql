-- MIGR 347 — LANDING-DYNAMIC-PRICING: Hydro-Jet 250° con precio dinámico por tamaño de contenedor.
-- Hoy es un servicio flat ($149.99 en tenant_landing_services.price) atado al form "Compra simple", que es el
-- DEFAULT compartido (Pintura de Tapas + 4 productos) → se le crea form PROPIO; "Compra simple" NO se toca.
-- Motor: matrix_1d atado al servicio (patrón Membresía Soterrados), campo containerSize, 4 tiers.
-- EXTENSIÓN DEL MOTOR (owner-aprobada): matrix_1d ahora soporta `qty_field` → el precio del tier escala por la
-- cantidad de un custom_field (containerQty). Guard: sin `qty_field` en el config el multiplicador es 1, así que
-- Membresías/evaluación/instalación quedan EXACTAMENTE igual. La cantidad también viaja al step del breakdown
-- para que _public_create_order la ponga en items[].qty → comprobante, PDF, email y Stripe (post Bug A/B) la muestran.
-- El add-on `hydroJet` ($39.99) dentro de las Membresías es OTRA cosa y no se toca. Órdenes históricas intactas.
CREATE OR REPLACE FUNCTION public._public_price_order(_t uuid, _items jsonb, _cf jsonb, _coupon text, _is_first_cycle boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare _base numeric := 0; _addons numeric := 0; _sub numeric := 0; _tax numeric := 0; _ship numeric := 0; _disc numeric := 0; _stdisc numeric := 0; _taxpct numeric;
        _it jsonb; _kind text; _iid uuid; _qty numeric; _p numeric; _mrule jsonb; _mri uuid; _arule jsonb; _trule jsonb; _promo jsonb; _c record;
        _freq text := nullif(_cf->>'frequency',''); _fi int; _bi int; _bins int; _steps jsonb := '[]'::jsonb; _tier numeric; _fval text;
        _m1 jsonb; _uprice numeric; _grand numeric; _mqty numeric := 1; _alines jsonb := '[]'::jsonb; _svc uuid;  -- _svc: servicio del pedido (para addon prices per_service)
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
        -- (LANDING-DYNAMIC-PRICING) qty_field: si la regla lo define, el precio del tier escala por esa cantidad
        -- del custom_field (ej. containerQty en Hydro-Jet). Sin qty_field el coalesce da 1 → no-op para Membresías.
        _mqty := greatest(coalesce(nullif(_cf->>(_m1->>'qty_field'),'')::numeric, 1), 1);
        _p := _p * _mqty;
        _steps := _steps || jsonb_build_object('rule','matrix_1d','value',_cf->>(_m1->>'field_name'),'price',_p,'qty',_mqty,'unit_price',coalesce(_uprice,_p/_mqty),'unit_label_es',_m1->>'unit_label_es','unit_label_en',_m1->>'unit_label_en');
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
  if _qty_eff is null then  -- matrix_1d con qty_field (Hydro-Jet): la cantidad viaja en el step como 'qty'
    select (st->>'qty')::numeric::int into _qty_eff from jsonb_array_elements(_calc->'breakdown'->'steps') st
     where st->>'rule' = 'matrix_1d' and coalesce((st->>'qty')::numeric,1) > 1 limit 1;
  end if;
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

-- ── (1) Form propio de Hydro-Jet ──────────────────────────────────────────────────────────────────────
insert into public.tenant_order_forms (id, tenant_id, name, description, is_default, is_active, show_summary,
  summary_footer_es, summary_footer_en)
values ('44444444-0000-4000-a000-000000000001','61205cb9-1418-4bfa-a029-bbb44d4e4310',
  'Solicitud Hydro-Jet 250°','Servicio de lavado a presión para contenedores de metal', false, true, true,
  '* Precio por contenedor según tamaño. Servicio de una sola vez.',
  '* Price per container by size. One-time service.')
on conflict (id) do nothing;

-- ── (2) Vincular el servicio al form nuevo (price se mantiene como fallback "desde") ──────────────────
update public.tenant_landing_services
   set form_id = '44444444-0000-4000-a000-000000000001', pricing_type = 'starting_from'
 where slug = 'hydro-jet-250' and tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310';

-- ── (3) Regla matrix_1d atada al servicio (ANTES de los campos: el trigger _sync_field_pricing la busca) ─
insert into public.tenant_pricing_rules (tenant_id, applies_to_kind, applies_to_id, rule_type, config, priority, is_active)
select '61205cb9-1418-4bfa-a029-bbb44d4e4310','service', s.id, 'matrix_1d',
  jsonb_build_object(
    'field_name','containerSize', 'qty_field','containerQty',
    'unit_label_es','por contenedor', 'unit_label_en','per container',
    'tiers', jsonb_build_array(
      jsonb_build_object('value','2yd','price',105.00,'unit_price',105.00),
      jsonb_build_object('value','4yd','price',145.00,'unit_price',145.00),
      jsonb_build_object('value','8yd','price',194.99,'unit_price',194.99),
      jsonb_build_object('value','10yd','price',249.99,'unit_price',249.99))),
  10, true
from public.tenant_landing_services s where s.slug='hydro-jet-250' and s.tenant_id='61205cb9-1418-4bfa-a029-bbb44d4e4310'
  and not exists (select 1 from public.tenant_pricing_rules r where r.applies_to_id=s.id and r.rule_type='matrix_1d');

-- ── (4) Campos de contacto/dirección: copiados 1:1 del form de Suscripción soterrados ─────────────────
insert into public.tenant_order_form_fields (tenant_id, form_id, order_index, kind, field_key, label_es, label_en,
  placeholder_es, placeholder_en, required, validation_rules, options, group_name)
select f.tenant_id, '44444444-0000-4000-a000-000000000001', f.order_index, f.kind, f.field_key, f.label_es, f.label_en,
  f.placeholder_es, f.placeholder_en, f.required, f.validation_rules, f.options, f.group_name
from public.tenant_order_form_fields f
where f.form_id = '11111111-0000-4000-a000-000000000002'
  and f.field_key in ('firstName','lastName','email','phone','address','unit','city','state','zip');

-- ── (5) Campos propios de Hydro-Jet ───────────────────────────────────────────────────────────────────
insert into public.tenant_order_form_fields (tenant_id, form_id, order_index, kind, field_key, label_es, label_en,
  required, validation_rules, options, group_name)
values
 ('61205cb9-1418-4bfa-a029-bbb44d4e4310','44444444-0000-4000-a000-000000000001',120,'select','containerSize',
  'Tamaño del contenedor','Container size', true, '{"default":"2yd"}'::jsonb,
  '[{"value":"2yd","label_es":"2 yd³ · Restaurantes pequeños / oficinas","label_en":"2 yd³ · Small restaurants / offices","price":105.00,"unit_price":105.00},
    {"value":"4yd","label_es":"4 yd³ · Restaurantes medianos / tiendas","label_en":"4 yd³ · Medium restaurants / stores","price":145.00,"unit_price":145.00},
    {"value":"8yd","label_es":"8 yd³ · Construcción pequeña / negocios medianos","label_en":"8 yd³ · Small construction / medium businesses","price":194.99,"unit_price":194.99},
    {"value":"10yd","label_es":"10 yd³ · Construcción / industriales","label_en":"10 yd³ · Construction / industrial","price":249.99,"unit_price":249.99}]'::jsonb,
  'Opciones de Servicio'),
 ('61205cb9-1418-4bfa-a029-bbb44d4e4310','44444444-0000-4000-a000-000000000001',130,'number','containerQty',
  '¿Cuántos contenedores?','How many containers?', true,
  '{"min":1,"max":10,"default":1,"helper_es":"El precio se multiplica por la cantidad de contenedores del mismo tamaño.","helper_en":"Price is multiplied by the number of containers of the same size."}'::jsonb,
  '[]'::jsonb, 'Opciones de Servicio'),
 ('61205cb9-1418-4bfa-a029-bbb44d4e4310','44444444-0000-4000-a000-000000000001',140,'disclaimer','_disc_quote',
  '¿Necesitas Hydro-Jet 250° para aceras, paredes, marquesinas, terrazas, parking o contenedores 20 yd³+? Solicita una cotización personalizada.',
  'Need Hydro-Jet 250° for sidewalks, walls, awnings, terraces, parking or 20+ yd³ containers? Request a custom quote.',
  false,
  '{"style":"info","link":"/servicios/hydro-jet","link_label_es":"Solicitar cotización →","link_label_en":"Request quote →"}'::jsonb,
  '[]'::jsonb, 'Opciones de Servicio'),
 ('61205cb9-1418-4bfa-a029-bbb44d4e4310','44444444-0000-4000-a000-000000000001',200,'textarea','note',
  'Notas adicionales','Additional notes', false, '{"max":500}'::jsonb, '[]'::jsonb, null),
 ('61205cb9-1418-4bfa-a029-bbb44d4e4310','44444444-0000-4000-a000-000000000001',210,'checkbox','termsAccepted',
  'Acepto las condiciones del servicio','I accept the service terms', true, '{}'::jsonb, '[]'::jsonb, null);
