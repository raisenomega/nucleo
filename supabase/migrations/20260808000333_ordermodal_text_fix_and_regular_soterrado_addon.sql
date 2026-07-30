-- LANDING-FORMS-PRICING Rodaja 1.6: fix textos residuales del OrderModal + simetría de add-ons cruzados.
-- BUG A: el helper del campo frequency en el form SOTERRADOS decía "zafacones exteriores regulares (NO SOTERRADOS)"
-- (texto correcto para Regular, contaminado en Soterrados). BUG B: el summary_footer de Soterrados tenía "$27.99/mes"
-- hardcoded viejo → genérico (el total recurrente ahora se muestra dinámico en el frontend). ASIMETRÍA: Regular no
-- tenía campo para añadir soterrados adicionales → se agrega (unit_price $29, el trigger lo namespacea a Regular).

-- BUG A — helper correcto para Soterrados (el de Regular queda intacto).
update public.tenant_order_form_fields
  set validation_rules = validation_rules
    || jsonb_build_object('helper_es','Tu servicio incluye dos (2) zafacones soterrados.',
                          'helper_en','Your service includes two (2) in-ground bins.')
  where field_key = 'frequency' and form_id = '11111111-0000-4000-a000-000000000002';

-- BUG B — footer genérico sin precio hardcoded (el recurrente dinámico lo pinta el frontend).
update public.tenant_order_forms
  set summary_footer_es = '* Suscripción recurrente. Cancela cuando quieras.',
      summary_footer_en = '* Recurring subscription. Cancel anytime.'
  where id = '11111111-0000-4000-a000-000000000002';

-- ASIMETRÍA — campo "soterrados adicionales" en el form Regular (…001). 5 opciones (0-4) como el de Soterrados;
-- opción 0 = "Sin soterrados" (Regular no incluye par soterrado). unit_price $29 → el trigger _sync_field_pricing
-- escribe per_service[service_Regular][additionalUnits]=29 (aislado de Soterrados, Rodaja 1.5).
insert into public.tenant_order_form_fields
  (id, tenant_id, form_id, field_key, kind, label_es, label_en, required, group_name, order_index, options, validation_rules)
values (
  gen_random_uuid(), '61205cb9-1418-4bfa-a029-bbb44d4e4310', '33333333-0000-4000-a000-000000000001',
  'additionalUnits', 'select',
  '¿Deseas añadir limpieza de zafacones soterrados?', 'Do you want to add underground bin cleaning?',
  false, 'Opciones de Servicio', 150,
  '[{"value":"0","label_es":"Sin soterrados","label_en":"None"},
    {"value":"1","label_es":"+1 soterrado adicional","label_en":"+1 additional buried bin"},
    {"value":"2","label_es":"+2 soterrados adicionales","label_en":"+2 additional buried bins"},
    {"value":"3","label_es":"+3 soterrados adicionales","label_en":"+3 additional buried bins"},
    {"value":"4","label_es":"+4 soterrados adicionales","label_en":"+4 additional buried bins"}]'::jsonb,
  jsonb_build_object('default','0','unit_price',29,
    'helper_es','Aplica solo si también tienes zafacones soterrados en tu propiedad.',
    'helper_en','Only applies if you also have in-ground bins on your property.')
);
