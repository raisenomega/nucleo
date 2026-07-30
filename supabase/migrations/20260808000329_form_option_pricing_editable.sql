-- LANDING-FORMS-PRICING Rodaja 1: precios de opciones editables desde el CMS (editor de campos del form).
-- Fuente editable = tenant_order_form_fields.options[].price (+unit_price en matrix_1d). Un trigger BEFORE mantiene
-- en sync, en la MISMA transacción del saveFields: (1) recomputa options[].price_display; (2) sincroniza el
-- config.tiers de la regla asociada (tiered_qty por config.field; matrix_1d por config.field_name + el ítem cuyo
-- form_id = el form del campo). El motor _public_price_order sigue leyendo config.tiers → sin cambio de contrato.

-- Formato de display consistente: entero → sin decimales; si no → 2 decimales; miles con coma. Ej. $260 / $19.98 / $1,395.
create or replace function public._fmt_price(_p numeric) returns text language sql immutable as $$
  select '$' || case when _p = trunc(_p) then to_char(_p, 'FM999,999,990') else to_char(_p, 'FM999,999,990.00') end;
$$;

-- Resuelve la regla de precio del campo (o null). matrix_1d se ata al ítem cuyo form_id = el form del campo.
create or replace function public._field_pricing_rule(_tenant uuid, _form_id uuid, _field_key text)
returns public.tenant_pricing_rules language sql stable as $$
  select pr.* from public.tenant_pricing_rules pr
  where pr.tenant_id = _tenant and pr.is_active
    and ( (pr.rule_type = 'tiered_qty' and pr.config->>'field' = _field_key)
       or (pr.rule_type = 'matrix_1d' and pr.config->>'field_name' = _field_key
           and pr.applies_to_id = (select s.id from public.tenant_landing_services s
                                    where s.form_id = _form_id and s.tenant_id = _tenant limit 1)) )
  order by pr.priority desc nulls last limit 1;
$$;

create or replace function public._sync_field_pricing() returns trigger language plpgsql
security definer set search_path to 'public' as $$
declare _rule public.tenant_pricing_rules; _recurring boolean; _newtiers jsonb; _newopts jsonb;
begin
  _rule := public._field_pricing_rule(NEW.tenant_id, NEW.form_id, NEW.field_key);
  if _rule.id is null then return NEW; end if;  -- campo sin regla → options intactas
  _recurring := _rule.rule_type = 'matrix_1d';  -- matrix_1d lleva unit_price; tiered_qty no
  -- Merge por value: parte de las tiers existentes (fuente de qué values tienen precio) y toma el precio de la
  -- opción del campo si viene; si no, conserva el de la tier. Nunca dropea ni inventa tiers.
  select jsonb_agg(
    tier || jsonb_build_object('price', coalesce((opt.o->>'price')::numeric, (tier->>'price')::numeric))
         || case when _recurring then jsonb_build_object('unit_price',
              coalesce((opt.o->>'unit_price')::numeric, (tier->>'unit_price')::numeric)) else '{}'::jsonb end)
  into _newtiers
  from jsonb_array_elements(_rule.config->'tiers') tier
  left join lateral (select o from jsonb_array_elements(NEW.options) o where o->>'value' = tier->>'value' limit 1) opt on true;
  update public.tenant_pricing_rules set config = config || jsonb_build_object('tiers', _newtiers), updated_at = now()
  where id = _rule.id;
  -- Recomputa price_display de cada opción desde el precio ya resuelto en las tiers.
  select jsonb_agg(
    case when t.tier is null then o else o || jsonb_build_object('price_display', public._fmt_price((t.tier->>'price')::numeric)) end)
  into _newopts
  from jsonb_array_elements(NEW.options) o
  left join lateral (select tier from jsonb_array_elements(_newtiers) tier where tier->>'value' = o->>'value' limit 1) t on true;
  NEW.options := coalesce(_newopts, NEW.options);
  return NEW;
end $$;

drop trigger if exists trg_sync_field_pricing on public.tenant_order_form_fields;
create trigger trg_sync_field_pricing before insert or update on public.tenant_order_form_fields
for each row execute function public._sync_field_pricing();

-- Backfill inicial (rule → options): puebla options[].price (+unit_price en matrix_1d) para que el editor muestre
-- los precios actuales. Recorre los campos que tienen regla y mergea el precio de la tier por value.
do $$
declare _f record; _rule public.tenant_pricing_rules; _rec boolean; _opts jsonb;
begin
  for _f in select id, tenant_id, form_id, field_key, options from public.tenant_order_form_fields where kind in ('select','radio') loop
    _rule := public._field_pricing_rule(_f.tenant_id, _f.form_id, _f.field_key);
    if _rule.id is null then continue; end if;
    _rec := _rule.rule_type = 'matrix_1d';
    select jsonb_agg(
      case when t.tier is null then o
      else o || jsonb_build_object('price', (t.tier->>'price')::numeric, 'price_display', public._fmt_price((t.tier->>'price')::numeric))
             || case when _rec and t.tier ? 'unit_price' then jsonb_build_object('unit_price', (t.tier->>'unit_price')::numeric) else '{}'::jsonb end
      end)
    into _opts
    from jsonb_array_elements(_f.options) o
    left join lateral (select tier from jsonb_array_elements(_rule.config->'tiers') tier where tier->>'value' = o->>'value' limit 1) t on true;
    update public.tenant_order_form_fields set options = _opts where id = _f.id;
  end loop;
end $$;
