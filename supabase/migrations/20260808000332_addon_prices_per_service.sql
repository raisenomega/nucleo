-- LANDING-FORMS-PRICING Rodaja 1.5: namespace por servicio en addon prices (fix del bug de sobreescritura
-- cross-service). Antes los addons editables (extraRegularBins/additionalUnits) vivían en una clave GLOBAL de
-- flat/addons.config → un mismo field_key en 2 forms sincronizaba la misma clave y se pisaban (Regular cobraba $30
-- por el edit de Soterrados). Ahora: config.per_service[service_id][field_key], con fallback al valor tenant-wide
-- (extraLids/hydroJet siguen globales). Motor: coalesce(per_service[svc][key], config[key], 0). Trigger escribe al
-- namespace del servicio dueño del form. Valores owner: Regular extraRegularBins $19, Soterrados $19 + additionalUnits $29.
CREATE OR REPLACE FUNCTION public._public_price_order(_t uuid, _items jsonb, _cf jsonb, _coupon text, _is_first_cycle boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare _base numeric := 0; _addons numeric := 0; _sub numeric := 0; _tax numeric := 0; _ship numeric := 0; _disc numeric := 0; _stdisc numeric := 0; _taxpct numeric;
        _it jsonb; _kind text; _iid uuid; _qty numeric; _p numeric; _mrule jsonb; _mri uuid; _arule jsonb; _trule jsonb; _promo jsonb; _c record;
        _freq text := nullif(_cf->>'frequency',''); _fi int; _bi int; _bins int; _steps jsonb := '[]'::jsonb; _tier numeric; _fval text;
        _m1 jsonb; _uprice numeric; _grand numeric; _svc uuid;  -- _svc: servicio del pedido (para addon prices per_service)
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
    'breakdown',jsonb_build_object('steps',_steps,'tax_pct',coalesce(_taxpct,0),'coupon_applied',(_disc>0 or _stdisc>0),'matrix_used',_freq is not null));
end $function$
;

-- Trigger extendido (Rodaja 1.5): los addon prices editables (select con validation.unit_price) se sincronizan al
-- NAMESPACE por servicio config.per_service[service_id][field_key], NO a la clave global (antes cross-service se
-- sobrescribían: extraRegularBins vivía en 2 forms). El servicio se resuelve por form_id (1:1, igual que matrix_1d).
create or replace function public._sync_field_pricing() returns trigger language plpgsql
security definer set search_path to 'public' as $$
declare _rule public.tenant_pricing_rules; _recurring boolean; _newtiers jsonb; _newopts jsonb;
        _addon_price numeric; _flat_id uuid; _svc uuid; _ps jsonb;
begin
  -- (1.5) Addon flat per_service: precio fijo por unidad extra, aislado por servicio.
  _addon_price := nullif(NEW.validation_rules->>'unit_price', '')::numeric;
  if _addon_price is not null then
    _svc := (select s.id from public.tenant_landing_services s where s.form_id = NEW.form_id and s.tenant_id = NEW.tenant_id limit 1);
    select id into _flat_id from public.tenant_pricing_rules
     where tenant_id = NEW.tenant_id and rule_type = 'flat' and config->>'kind' = 'addons' and is_active limit 1;
    if _flat_id is not null and _svc is not null then
      -- deep-merge en per_service[service][field_key] sin dropear otros servicios/claves
      update public.tenant_pricing_rules pr set config = pr.config || jsonb_build_object('per_service',
        coalesce(pr.config->'per_service','{}'::jsonb) || jsonb_build_object(_svc::text,
          coalesce(pr.config->'per_service'->_svc::text,'{}'::jsonb) || jsonb_build_object(NEW.field_key, _addon_price))),
        updated_at = now() where pr.id = _flat_id;
    end if;
  end if;
  -- (1.0) matrix_1d / tiered_qty por opción. Para campos addon _field_pricing_rule devuelve null → no-op.
  _rule := public._field_pricing_rule(NEW.tenant_id, NEW.form_id, NEW.field_key);
  if _rule.id is null then return NEW; end if;
  _recurring := _rule.rule_type = 'matrix_1d';
  select jsonb_agg(
    tier || jsonb_build_object('price', coalesce((opt.o->>'price')::numeric, (tier->>'price')::numeric))
         || case when _recurring then jsonb_build_object('unit_price',
              coalesce((opt.o->>'unit_price')::numeric, (tier->>'unit_price')::numeric)) else '{}'::jsonb end)
  into _newtiers
  from jsonb_array_elements(_rule.config->'tiers') tier
  left join lateral (select o from jsonb_array_elements(NEW.options) o where o->>'value' = tier->>'value' limit 1) opt on true;
  update public.tenant_pricing_rules set config = config || jsonb_build_object('tiers', _newtiers), updated_at = now()
  where id = _rule.id;
  select jsonb_agg(
    case when t.tier is null then o else o || jsonb_build_object('price_display', public._fmt_price((t.tier->>'price')::numeric)) end)
  into _newopts
  from jsonb_array_elements(NEW.options) o
  left join lateral (select tier from jsonb_array_elements(_newtiers) tier where tier->>'value' = o->>'value' limit 1) t on true;
  NEW.options := coalesce(_newopts, NEW.options);
  return NEW;
end $$;

-- BACKFILL (valores comerciales reales owner-confirmados; descarta los valores contaminados por el bug).
-- Regular (…0002): extraRegularBins $19. Soterrados (…0001): extraRegularBins $19, additionalUnits $29.
-- Set en validation.unit_price de cada campo → el trigger nuevo escribe config.per_service[servicio][key].
update public.tenant_order_form_fields set validation_rules = coalesce(validation_rules,'{}'::jsonb) || '{"unit_price":19}'::jsonb
where field_key = 'extraRegularBins' and form_id in ('33333333-0000-4000-a000-000000000001','11111111-0000-4000-a000-000000000002');
update public.tenant_order_form_fields set validation_rules = coalesce(validation_rules,'{}'::jsonb) || '{"unit_price":29}'::jsonb
where field_key = 'additionalUnits' and form_id = '11111111-0000-4000-a000-000000000002';
