-- Migración 148: siembra catálogo Zafacones 1:1 legacy — categorías + 3 forms nuevos + 4 productos + 6 servicios
-- + wire form_id + pricing rule instalación. Idempotente (UUIDs fijos + ON CONFLICT + NOT EXISTS). Solo tenant roy.
-- Copy ES/EN 1:1 de la sonda. Evaluation pricing + promo coupon ya existían (2.5). services sin billing_type (por form).
do $$ declare R constant uuid := '61205cb9-1418-4bfa-a029-bbb44d4e4310';
begin
if not exists (select 1 from public.tenants where id = R) then return; end if;

-- 2.A cleanup: borra forms de prueba sin dependencias
delete from public.tenant_order_forms f where f.tenant_id = R and f.name in ('Compra simple - COPIA','Suscripcion TITO')
  and not exists (select 1 from public.tenant_landing_products p where p.form_id = f.id)
  and not exists (select 1 from public.tenant_landing_services s where s.form_id = f.id)
  and not exists (select 1 from public.tenant_landing_packages k where k.form_id = f.id);

-- 2.B categorías
insert into public.tenant_landing_categories (id, tenant_id, slug, name, category_type, display_order, is_active)
values ('44444444-0000-4000-a000-000000000001', R, 'suscripciones', 'Suscripciones', 'service', 10, true),
       ('44444444-0000-4000-a000-000000000002', R, 'servicios-one-time', 'Servicios One-Time', 'service', 20, true),
       ('44444444-0000-4000-a000-000000000003', R, 'productos', 'Productos', 'product', 30, true)
on conflict (id) do nothing;

-- 2.C forms nuevos
insert into public.tenant_order_forms (id, tenant_id, name, description, is_default, applies_to_kind, is_active) values
  ('33333333-0000-4000-a000-000000000001', R, 'Suscripción Regular', 'Limpieza mensual regular (sin soterrados)', false, 'service', true),
  ('33333333-0000-4000-a000-000000000002', R, 'Evaluación', 'Visita de evaluación por tipo de propiedad', false, 'service', true),
  ('33333333-0000-4000-a000-000000000003', R, 'Instalación Soterrados', 'Instalación por cantidad de soterrados', false, 'service', true)
on conflict (id) do nothing;

-- Regular = clon soterrados menos extraBuriedBins
insert into public.tenant_order_form_fields (id, tenant_id, form_id, order_index, kind, field_key, label_es, label_en, placeholder_es, placeholder_en, required, validation_rules, options, conditional_on, group_name)
select gen_random_uuid(), R, '33333333-0000-4000-a000-000000000001', row_number() over (order by order_index) - 1, kind, field_key, label_es, label_en, placeholder_es, placeholder_en, required, validation_rules, options, conditional_on, group_name
from public.tenant_order_form_fields where form_id = '11111111-0000-4000-a000-000000000002' and field_key <> 'extraBuriedBins'
and not exists (select 1 from public.tenant_order_form_fields x where x.form_id = '33333333-0000-4000-a000-000000000001');

-- Evaluación / Instalación = clon Compra simple (5 campos) + un select propio al final
insert into public.tenant_order_form_fields (id, tenant_id, form_id, order_index, kind, field_key, label_es, label_en, placeholder_es, placeholder_en, required, validation_rules, options, conditional_on, group_name)
select gen_random_uuid(), R, t.fid, f.order_index, f.kind, f.field_key, f.label_es, f.label_en, f.placeholder_es, f.placeholder_en, f.required, f.validation_rules, f.options, f.conditional_on, f.group_name
from public.tenant_order_form_fields f cross join (values ('33333333-0000-4000-a000-000000000002'::uuid), ('33333333-0000-4000-a000-000000000003'::uuid)) t(fid)
where f.form_id = '11111111-0000-4000-a000-000000000001'
and not exists (select 1 from public.tenant_order_form_fields x where x.form_id = t.fid);

insert into public.tenant_order_form_fields (id, tenant_id, form_id, order_index, kind, field_key, label_es, label_en, required, options)
values (gen_random_uuid(), R, '33333333-0000-4000-a000-000000000002', 5, 'select', 'evaluationType', 'Tipo de evaluación', 'Evaluation type', true,
  '[{"value":"individual","label_es":"Evaluación individual (1 propiedad)","label_en":"Individual evaluation (1 property)"},{"value":"condominio","label_es":"Evaluación de condominios","label_en":"Condominium evaluation"},{"value":"urb-pequena","label_es":"Urbanización (menos de 65 casas)","label_en":"Subdivision (under 65 homes)"},{"value":"urb-grande","label_es":"Urbanización (más de 100 casas)","label_en":"Subdivision (100+ homes)"}]'::jsonb),
  (gen_random_uuid(), R, '33333333-0000-4000-a000-000000000003', 5, 'select', 'installQty', 'Cantidad de soterrados', 'Number of buried bins', true,
  '[{"value":"1","label_es":"1 Zafacón Soterrado","label_en":"1 Buried Bin"},{"value":"2","label_es":"2 Zafacones Soterrados","label_en":"2 Buried Bins"},{"value":"3","label_es":"3 Zafacones Soterrados","label_en":"3 Buried Bins"},{"value":"4","label_es":"4 Zafacones Soterrados","label_en":"4 Buried Bins"}]'::jsonb)
on conflict (form_id, field_key) do nothing;

-- 2.D productos (4 nuevos)
insert into public.tenant_landing_products (id, tenant_id, category_id, slug, name, short_description, price, compare_at_price, currency, is_active, is_featured, is_published, display_order, form_id)
values ('55555555-0000-4000-a000-000000000001', R, '44444444-0000-4000-a000-000000000003', 'goznes-nuevos', 'Goznes Nuevos (instalados)', 'Goznes nuevos instalados', 40, null, 'USD', true, false, true, 1, '11111111-0000-4000-a000-000000000001'),
  ('55555555-0000-4000-a000-000000000002', R, '44444444-0000-4000-a000-000000000003', 'tapa-premium-25', 'Tapa Premium 25"', 'Tapa premium 25 pulgadas', 84.99, 99.99, 'USD', true, false, true, 2, '11111111-0000-4000-a000-000000000001'),
  ('55555555-0000-4000-a000-000000000003', R, '44444444-0000-4000-a000-000000000003', 'tapa-remanufacturada-25', 'Tapa Remanufacturada 25"', 'Tapa remanufacturada 25 pulgadas', 44.99, 59.99, 'USD', true, false, true, 3, '11111111-0000-4000-a000-000000000001'),
  ('55555555-0000-4000-a000-000000000004', R, '44444444-0000-4000-a000-000000000003', 'zafacon-flex-ever-30', 'Zafacón Flex Ever 30 gal', 'Zafacón Flex Ever 30 galones', 50, null, 'USD', true, false, true, 4, '11111111-0000-4000-a000-000000000001')
on conflict (id) do nothing;

-- 2.D servicios (6)
insert into public.tenant_landing_services (id, tenant_id, category_id, slug, name, short_description, pricing_type, price, requires_scheduling, is_active, is_featured, is_published, display_order, form_id)
values ('66666666-0000-4000-a000-000000000001', R, '44444444-0000-4000-a000-000000000001', 'suscripcion-soterrados', 'Suscripción Soterrados', 'Limpieza de zafacones soterrados por frecuencia', 'starting_from', 49.99, true, true, true, true, 1, '11111111-0000-4000-a000-000000000002'),
  ('66666666-0000-4000-a000-000000000002', R, '44444444-0000-4000-a000-000000000001', 'suscripcion-regular', 'Servicio Mensual Regular', 'Limpieza mensual regular de zafacones', 'fixed', 27.99, true, true, true, true, 2, '33333333-0000-4000-a000-000000000001'),
  ('66666666-0000-4000-a000-000000000003', R, '44444444-0000-4000-a000-000000000002', 'pintura-tapas', 'Pintura de Tapas', 'Pintura de tapas de zafacones', 'fixed', 15, true, true, false, true, 3, '11111111-0000-4000-a000-000000000001'),
  ('66666666-0000-4000-a000-000000000004', R, '44444444-0000-4000-a000-000000000002', 'evaluacion', 'Evaluación', 'Visita de evaluación por tipo de propiedad', 'starting_from', 80, true, true, true, true, 4, '33333333-0000-4000-a000-000000000002'),
  ('66666666-0000-4000-a000-000000000005', R, '44444444-0000-4000-a000-000000000002', 'hydro-jet', 'Hydro-Jet 250°', 'Desinfección profunda Hydro-Jet 250°F / 5,500 PSI', 'fixed', 39.99, true, true, false, true, 5, '11111111-0000-4000-a000-000000000001'),
  ('66666666-0000-4000-a000-000000000006', R, '44444444-0000-4000-a000-000000000002', 'instalacion-soterrados', 'Instalación Soterrados', 'Instalación profesional de zafacones soterrados', 'starting_from', 495, true, true, true, true, 6, '33333333-0000-4000-a000-000000000003')
on conflict (id) do nothing;

-- 2.E items existentes → categoría/form
update public.tenant_landing_products set category_id = '44444444-0000-4000-a000-000000000003' where tenant_id = R and slug = 'zafacon-55-gl' or (tenant_id = R and name = 'Zafacon 55 gl');
update public.tenant_landing_packages set form_id = '11111111-0000-4000-a000-000000000001' where tenant_id = R and form_id is null;

-- 2.F pricing rule instalación (evaluation + promo coupon ya existen de 2.5)
insert into public.tenant_pricing_rules (id, tenant_id, applies_to_kind, rule_type, config, priority, is_active)
values ('22222222-0000-4000-a000-000000000006', R, 'service', 'tiered_qty',
  '{"kind":"installation","field":"installQty","1":495,"2":990,"3":1395,"4":1850}'::jsonb, 10, true)
on conflict (id) do nothing;
end $$;
