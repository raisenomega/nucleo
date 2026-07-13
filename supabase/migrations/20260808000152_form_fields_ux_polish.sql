-- Migración 152: UX polish de campos del form (solo presentación, CERO cambios en pricing/backend).
-- Zafacones (tenant roy): copy de 'frequency', price_display inline en 'hydroJet', terms_link + copy de error
-- en 'termsAccepted'. Merge jsonb con || preserva las claves existentes (default/error_en). terms_link -> /terms
-- (ruta legal real YA existente, bilingüe brand-aware; NO se crea /legal/terms).
update public.tenant_order_form_fields f
  set label_es = 'Frecuencia que desea el servicio', label_en = 'Service frequency'
  from public.tenant_order_forms fo
  where f.form_id = fo.id and fo.tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and f.field_key = 'frequency';

update public.tenant_order_form_fields f
  set validation_rules = f.validation_rules || '{"price_display":"+$39.99"}'::jsonb
  from public.tenant_order_forms fo
  where f.form_id = fo.id and fo.tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and f.field_key = 'hydroJet';

update public.tenant_order_form_fields f
  set validation_rules = f.validation_rules || jsonb_build_object(
    'terms_link', '/terms', 'terms_link_label_es', 'Ver', 'terms_link_label_en', 'View',
    'error_es', 'Debes aceptar los términos y condiciones de este servicio para continuar al checkout.')
  from public.tenant_order_forms fo
  where f.form_id = fo.id and fo.tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and f.field_key = 'termsAccepted';
