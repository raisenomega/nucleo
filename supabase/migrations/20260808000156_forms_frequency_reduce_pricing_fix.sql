-- Migración 156: forms-align.fix2 (Zafacones). BUG2: frequency 5→3 opciones (2w/4w/6w). BUG1: el select
-- extraBuriedBins del form soterrados debe ofrecer los valores del axis_y de la matriz (2..6) para que
-- base = matriz[frequency][extraBuriedBins] calcule (antes options 0/+1..+6 → 0 y 1 no están en la matriz → $0).
-- La MATRIZ pricing NO se toca (sigue 5 filas 2w..10w; 8w/10w quedan disponibles si el owner reabre frecuencias).
-- frequency default '4w' preservado.

update public.tenant_order_form_fields
  set options = '[{"value":"2w","label_es":"Cada 2 semanas","label_en":"Every 2 weeks"},
    {"value":"4w","label_es":"Cada 4 semanas","label_en":"Every 4 weeks"},
    {"value":"6w","label_es":"Cada 6 semanas","label_en":"Every 6 weeks"}]'::jsonb
  where field_key = 'frequency'
    and form_id in ('11111111-0000-4000-a000-000000000002','33333333-0000-4000-a000-000000000001');

update public.tenant_order_form_fields
  set options = '[{"value":"2","label_es":"2 Zafacones Soterrados","label_en":"2 Buried Bins"},
    {"value":"3","label_es":"3 Zafacones Soterrados","label_en":"3 Buried Bins"},
    {"value":"4","label_es":"4 Zafacones Soterrados","label_en":"4 Buried Bins"},
    {"value":"5","label_es":"5 Zafacones Soterrados","label_en":"5 Buried Bins"},
    {"value":"6","label_es":"6 Zafacones Soterrados","label_en":"6 Buried Bins"}]'::jsonb,
    validation_rules = validation_rules || '{"default":"2"}'::jsonb
  where field_key = 'extraBuriedBins' and form_id = '11111111-0000-4000-a000-000000000002';
