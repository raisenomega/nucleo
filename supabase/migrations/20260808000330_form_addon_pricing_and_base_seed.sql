-- LANDING-FORMS-PRICING Rodaja 1.2 (GAP A): precio por unidad de "zafacones adicionales" editable desde el CMS +
-- corrección de precios base por frecuencia. Modelo híbrido (ya lo calcula el motor): base_frecuencia (matrix_1d) +
-- Σ(qty × precio_fijo_por_unidad) (flat/addons). El precio/unidad vivía en la regla flat/addons (solo por SQL).
-- Ahora se edita en el campo (validation_rules.unit_price) y el trigger _sync_field_pricing lo sincroniza a la regla.
-- (GAP B — hook primer ciclo — es Rodaja 1.3, requiere cambios en el checkout de suscripción de Stripe.)

-- Trigger extendido: además del sync matrix_1d/tiered_qty por opción (Rodaja 1), sincroniza el precio/unidad de un
-- campo addon (validation_rules.unit_price) a la clave correspondiente de la regla flat/addons.
create or replace function public._sync_field_pricing() returns trigger language plpgsql
security definer set search_path to 'public' as $$
declare _rule public.tenant_pricing_rules; _recurring boolean; _newtiers jsonb; _newopts jsonb;
        _addon_price numeric; _flat_id uuid;
begin
  -- (1.2) Addon flat: precio fijo por unidad extra (no varía por frecuencia). Si el field_key es una clave de la
  -- regla flat/addons y el campo trae validation_rules.unit_price → sincroniza ese valor a la regla.
  _addon_price := nullif(NEW.validation_rules->>'unit_price', '')::numeric;
  if _addon_price is not null then
    select id into _flat_id from public.tenant_pricing_rules
     where tenant_id = NEW.tenant_id and rule_type = 'flat' and config->>'kind' = 'addons' and is_active and config ? NEW.field_key limit 1;
    if _flat_id is not null then
      update public.tenant_pricing_rules set config = jsonb_set(config, array[NEW.field_key], to_jsonb(_addon_price)), updated_at = now() where id = _flat_id;
    end if;
  end if;
  -- (1.0) matrix_1d / tiered_qty por opción (Rodaja 1). Para campos addon _field_pricing_rule devuelve null → no-op.
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

-- SEED Zafacones (owner-confirmado). Precios base por frecuencia (vía options del campo frequency → trigger sync).
-- Membresía Regular (form Suscripción Regular / service …0002): 2w 59.99, 4w 39.99, 6w 44.99.
update public.tenant_order_form_fields set options = (
  select jsonb_agg(o || jsonb_build_object('price',
    case o->>'value' when '2w' then 59.99 when '4w' then 39.99 when '6w' then 44.99 else nullif(o->>'price','')::numeric end))
  from jsonb_array_elements(options) o)
where form_id = '33333333-0000-4000-a000-000000000001' and field_key = 'frequency';
-- Membresía Soterrados (form Suscripción soterrados / service …0001): 2w 99.95, 4w 69.95, 6w 79.95.
update public.tenant_order_form_fields set options = (
  select jsonb_agg(o || jsonb_build_object('price',
    case o->>'value' when '2w' then 99.95 when '4w' then 69.95 when '6w' then 79.95 else nullif(o->>'price','')::numeric end))
  from jsonb_array_elements(options) o)
where form_id = '11111111-0000-4000-a000-000000000002' and field_key = 'frequency';

-- Precio/unidad de adicionales (flat, fijo): regular $15, soterrado $25. Set en el campo → trigger sync a la regla.
update public.tenant_order_form_fields set validation_rules = coalesce(validation_rules, '{}'::jsonb) || '{"unit_price":15}'::jsonb
where field_key = 'extraRegularBins' and form_id in ('33333333-0000-4000-a000-000000000001', '11111111-0000-4000-a000-000000000002');
update public.tenant_order_form_fields set validation_rules = coalesce(validation_rules, '{}'::jsonb) || '{"unit_price":25}'::jsonb
where field_key = 'additionalUnits' and form_id = '11111111-0000-4000-a000-000000000002';
