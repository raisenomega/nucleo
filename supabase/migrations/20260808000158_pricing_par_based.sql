-- Migración 158: pricing par-based (Zafacones). Regular+Soterrados venden "por el par" (2u); precio del par varía por
-- frecuencia (matrix_1d 1D: frequency→precio par + unit_price para leyenda). Extras = add-ons planos encima del par.
-- Reemplaza el flat $27.99 (Regular) y la matrix_2d (Soterrados) por matrix_1d scopeada por applies_to_id.
-- Motor: nuevo rule_type matrix_1d + additionalUnits como add-on. Cero cambios en Evaluación/Instalación/otros tenants.

alter table public.tenant_pricing_rules drop constraint if exists tenant_pricing_rules_rule_type_check;
alter table public.tenant_pricing_rules add constraint tenant_pricing_rules_rule_type_check
  check (rule_type in ('flat','tiered_qty','matrix_2d','matrix_1d','percentage_discount','coupon','tax','shipping'));

create or replace function public._public_price_order(_t uuid, _items jsonb, _cf jsonb, _coupon text, _is_first_cycle boolean default true)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $fn$
declare _base numeric := 0; _tax numeric := 0; _ship numeric := 0; _disc numeric := 0; _taxpct numeric;
        _it jsonb; _kind text; _iid uuid; _qty numeric; _p numeric; _mrule jsonb; _mri uuid; _arule jsonb; _trule jsonb; _promo jsonb; _c record;
        _freq text := nullif(_cf->>'frequency',''); _fi int; _bi int; _bins int; _steps jsonb := '[]'::jsonb; _tier numeric; _fval text;
        _m1 jsonb; _uprice numeric;
begin
  select config, applies_to_id into _mrule, _mri from public.tenant_pricing_rules where tenant_id=_t and rule_type='matrix_2d' and is_active limit 1;
  select config into _arule from public.tenant_pricing_rules where tenant_id=_t and rule_type='flat' and config->>'kind'='addons' and is_active limit 1;
  select config into _trule from public.tenant_pricing_rules where tenant_id=_t and rule_type='tiered_qty' and is_active and config ? 'field' and _cf ? (config->>'field') limit 1;
  for _it in select value from jsonb_array_elements(coalesce(_items,'[]'::jsonb)) loop
    _kind := _it->>'kind'; _iid := nullif(_it->>'id','')::uuid; _qty := coalesce(nullif(_it->>'qty','')::numeric,1); _p := 0;
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
        _steps := _steps || jsonb_build_object('rule','matrix_1d','value',_cf->>(_m1->>'field_name'),'price',_p,'unit_price',_uprice,'unit_label_es',_m1->>'unit_label_es','unit_label_en',_m1->>'unit_label_en');
      else select price into _p from public.tenant_landing_services where id=_iid and tenant_id=_t; end if;
    elsif _kind='package' then select price into _p from public.tenant_landing_packages where id=_iid and tenant_id=_t;
    end if;
    _base := _base + coalesce(_p,0)*_qty;
  end loop;
  if _arule is not null then
    _base := _base + coalesce(nullif(_cf->>'extraLids','')::numeric,0)*coalesce((_arule->>'extraLids')::numeric,0)
      + coalesce(nullif(_cf->>'extraRegularBins','')::numeric,0)*coalesce((_arule->>'extraRegularBins')::numeric,0)
      + coalesce(nullif(_cf->>'additionalUnits','')::numeric,0)*coalesce((_arule->>'additionalUnits')::numeric,0)
      + case when coalesce((_cf->>'hydroJet')::boolean,false) then coalesce((_arule->>'hydroJet')::numeric,0) else 0 end;
  end if;
  select (config->>'percentage')::numeric into _taxpct from public.tenant_pricing_rules where tenant_id=_t and rule_type='tax' and is_active order by priority desc limit 1;
  _tax := round(_base*coalesce(_taxpct,0)/100.0,2);
  select coalesce((config->>'amount')::numeric,0) into _ship from public.tenant_pricing_rules where tenant_id=_t and rule_type='shipping' and is_active order by priority desc limit 1;
  _ship := coalesce(_ship,0);
  if coalesce(_coupon,'')<>'' then
    select config into _promo from public.tenant_pricing_rules where tenant_id=_t and rule_type='coupon' and config->>'code'=_coupon and is_active limit 1;
    if _promo is not null then
      _disc := greatest(_base - (case when _is_first_cycle then (_promo->>'first_cycle_price')::numeric else (_promo->>'recurring_price')::numeric end), 0);
      _steps := _steps || jsonb_build_object('rule','coupon','code',_coupon,'type',case when _is_first_cycle then 'first_cycle' else 'recurring' end,'discount',_disc);
    else
      select * into _c from public.tenant_coupons where tenant_id=_t and code=_coupon and is_active and (expires_at is null or expires_at>now()) and (max_uses is null or current_uses<max_uses) limit 1;
      if found then _disc := case when _c.discount_type='percentage' then round(_base*_c.value/100.0,2) else least(_c.value,_base) end; end if;
    end if;
  end if;
  return jsonb_build_object('subtotal',round(_base,2),'tax',_tax,'shipping',_ship,'discount',_disc,'total',round(_base+_tax+_ship-_disc,2),
    'breakdown',jsonb_build_object('steps',_steps,'tax_pct',coalesce(_taxpct,0),'coupon_applied',_disc>0,'matrix_used',_freq is not null));
end $fn$;
grant execute on function public._public_price_order(uuid, jsonb, jsonb, text, boolean) to anon, authenticated;

-- Data (solo Zafacones): DELETE matrix_2d Soterrados + INSERT matrix_1d Regular/Soterrados.
delete from public.tenant_pricing_rules where tenant_id='61205cb9-1418-4bfa-a029-bbb44d4e4310' and rule_type in ('matrix_2d','matrix_1d');
insert into public.tenant_pricing_rules (tenant_id, applies_to_kind, applies_to_id, rule_type, config, priority, is_active) values
 ('61205cb9-1418-4bfa-a029-bbb44d4e4310','service','66666666-0000-4000-a000-000000000002','matrix_1d',
  '{"field_name":"frequency","unit_label_es":"c/u","unit_label_en":"ea.","tiers":[{"value":"2w","price":19.98,"unit_price":9.99},{"value":"4w","price":29.98,"unit_price":14.99},{"value":"6w","price":49.98,"unit_price":24.99}]}'::jsonb,10,true),
 ('61205cb9-1418-4bfa-a029-bbb44d4e4310','service','66666666-0000-4000-a000-000000000001','matrix_1d',
  '{"field_name":"frequency","unit_label_es":"c/pieza","unit_label_en":"per piece","tiers":[{"value":"2w","price":60,"unit_price":15},{"value":"4w","price":49.96,"unit_price":12.49},{"value":"6w","price":65,"unit_price":16.25}]}'::jsonb,10,true);

-- Add-ons: extraRegularBins 24.99→12.50 + additionalUnits 24.98 (Zafacones).
update public.tenant_pricing_rules set config = config || '{"extraRegularBins":12.50,"additionalUnits":24.98}'::jsonb
  where tenant_id='61205cb9-1418-4bfa-a029-bbb44d4e4310' and rule_type='flat' and config->>'kind'='addons';

-- Form Soterrados: extraBuriedBins → additionalUnits (select 0..4, addon).
update public.tenant_order_form_fields set field_key='additionalUnits', kind='select',
  label_es='¿Soterrados adicionales al par incluido?', label_en='Additional buried bins beyond the included pair?',
  validation_rules = (validation_rules - 'min' - 'max') || '{"default":"0"}'::jsonb,
  options='[{"value":"0","label_es":"Sin adicionales (solo el par incluido)","label_en":"None (only included pair)"},{"value":"1","label_es":"+1 soterrado adicional","label_en":"+1 additional buried bin"},{"value":"2","label_es":"+2 soterrados adicionales","label_en":"+2 additional buried bins"},{"value":"3","label_es":"+3 soterrados adicionales","label_en":"+3 additional buried bins"},{"value":"4","label_es":"+4 soterrados adicionales","label_en":"+4 additional buried bins"}]'::jsonb
  where form_id='11111111-0000-4000-a000-000000000002' and field_key='extraBuriedBins';

-- Form Regular+Soterrados: relabel options extraRegularBins ("+N zafacón adicional", al par base).
update public.tenant_order_form_fields set
  options='[{"value":"0","label_es":"Sin adicionales (solo el par incluido)","label_en":"None (only included pair)"},{"value":"1","label_es":"+1 zafacón adicional","label_en":"+1 additional bin"},{"value":"2","label_es":"+2 zafacones adicionales","label_en":"+2 additional bins"},{"value":"3","label_es":"+3 zafacones adicionales","label_en":"+3 additional bins"},{"value":"4","label_es":"+4 zafacones adicionales","label_en":"+4 additional bins"},{"value":"5","label_es":"+5 zafacones adicionales","label_en":"+5 additional bins"},{"value":"6","label_es":"+6 zafacones adicionales","label_en":"+6 additional bins"}]'::jsonb
  where field_key='extraRegularBins' and form_id in ('11111111-0000-4000-a000-000000000002','33333333-0000-4000-a000-000000000001');
