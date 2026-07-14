-- Migración 157: pricing-audit.fixB1. P0 (Regular cobraba $0 base) + matriz Soterrados 1:1 legacy + Zafacon 55 gl OUT.
-- NOTA: la premisa "scope applies_to_id, cero cambios motor" NO era viable — el motor seleccionaba la matriz
-- tenant-wide sin filtrar por applies_to_id y sin exigir que el item use los ejes. Fix mínimo y guardado en el motor:
-- la rama matrix solo aplica si (a) el custom_fields trae el campo axis_y (extraBuriedBins) Y (b) la regla no está
-- scopeada a otro item. Así Regular (sin extraBuriedBins) cae a su precio plano $27.99; Soterrados sigue en matriz.

create or replace function public._public_price_order(_t uuid, _items jsonb, _cf jsonb, _coupon text, _is_first_cycle boolean default true)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $fn$
declare _base numeric := 0; _tax numeric := 0; _ship numeric := 0; _disc numeric := 0; _taxpct numeric;
        _it jsonb; _kind text; _iid uuid; _qty numeric; _p numeric; _mrule jsonb; _mri uuid; _arule jsonb; _trule jsonb; _promo jsonb; _c record;
        _freq text := nullif(_cf->>'frequency',''); _fi int; _bi int; _bins int; _steps jsonb := '[]'::jsonb; _tier numeric; _fval text;
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
    elsif _kind='service' then select price into _p from public.tenant_landing_services where id=_iid and tenant_id=_t;
    elsif _kind='package' then select price into _p from public.tenant_landing_packages where id=_iid and tenant_id=_t;
    end if;
    _base := _base + coalesce(_p,0)*_qty;
  end loop;
  if _arule is not null then
    _base := _base + coalesce(nullif(_cf->>'extraLids','')::numeric,0)*coalesce((_arule->>'extraLids')::numeric,0)
      + coalesce(nullif(_cf->>'extraRegularBins','')::numeric,0)*coalesce((_arule->>'extraRegularBins')::numeric,0)
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
    'breakdown',jsonb_build_object('steps',_steps,'tax_pct',coalesce(_taxpct,0),'coupon_applied',_disc>0,'matrix_used',_freq is not null and _mrule is not null and _cf ? (_mrule->'axis_y'->>'field') and _trule is null));
end $fn$;
grant execute on function public._public_price_order(uuid, jsonb, jsonb, text, boolean) to anon, authenticated;

-- Data (solo Zafacones): scope de la matriz al service Soterrados + matriz 6w/8w/10w 1:1 legacy (2w/4w ya coincidían).
update public.tenant_pricing_rules
  set applies_to_id = '66666666-0000-4000-a000-000000000001',
      config = jsonb_set(config, '{matrix}', '[[49.99,69.95,94.99,114.99,129.99],[49.99,69.95,94.99,114.99,129.99],[58,79,107.99,122.99,145],[64.99,87.99,115,134.99,164.99],[70,95,120,149.99,175]]'::jsonb)
  where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and rule_type = 'matrix_2d';

-- Zafacon 55 gl: soft-delete (tiene 2 órdenes históricas → preservar registro; is_active=false lo saca del landing).
update public.tenant_landing_products set is_active = false
  where id = 'f4cff117-f48b-457a-8b3c-d729fe0f9c14' and tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310';
