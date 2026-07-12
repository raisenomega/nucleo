-- Migración 143: SEED Zafacones — config real del Order System (form + pricing + payment + coupon).
-- Solo datos del tenant roy-ramos. Idempotente (UUIDs fijos + ON CONFLICT + WHERE EXISTS(tenant) → skip si falta).
-- Textos ES/EN 1:1 de la sonda legacy. Correcciones: coupon sin col config → modelo promo va a pricing_rule
-- rule_type='coupon'; matriz 6w/8w/10w usa valores del spec #3 (difieren de la sonda — confirmar con owner).
-- Nota: defaults de campo (state='PR', frequency='4w', etc.) van en validation_rules.default (no hay col dedicada).

-- ══════════ FORMS (UUIDs fijos) ══════════
insert into public.tenant_order_forms (id, tenant_id, name, description, is_default, applies_to_kind, is_active)
select '11111111-0000-4000-a000-000000000001', '61205cb9-1418-4bfa-a029-bbb44d4e4310', 'Compra simple', 'Productos y servicios one-time', true, 'product', true
where exists (select 1 from public.tenants where id='61205cb9-1418-4bfa-a029-bbb44d4e4310')
on conflict (id) do nothing;
insert into public.tenant_order_forms (id, tenant_id, name, description, is_default, applies_to_kind, is_active)
select '11111111-0000-4000-a000-000000000002', '61205cb9-1418-4bfa-a029-bbb44d4e4310', 'Suscripción soterrados', 'Servicio recurrente por frecuencia', false, 'service', true
where exists (select 1 from public.tenants where id='61205cb9-1418-4bfa-a029-bbb44d4e4310')
on conflict (id) do nothing;

-- ══════════ FORM FIELDS ══════════
insert into public.tenant_order_form_fields (tenant_id, form_id, order_index, kind, field_key, label_es, label_en, required, validation_rules, options, conditional_on)
select '61205cb9-1418-4bfa-a029-bbb44d4e4310', v.form_id::uuid, v.oi, v.kind, v.fk, v.les, v.len, v.req, v.vr::jsonb, v.opt::jsonb, v.cond::jsonb
from (values
  -- Form 1: Compra simple (5)
  ('11111111-0000-4000-a000-000000000001', 1, 'text', 'name', 'Nombre completo', 'Full name', true, '{"min":2,"max":80}', '[]', null),
  ('11111111-0000-4000-a000-000000000001', 2, 'tel', 'phone', 'Teléfono', 'Phone', true, '{"min":7,"max":25,"format":"phone"}', '[]', null),
  ('11111111-0000-4000-a000-000000000001', 3, 'email', 'email', 'Correo electrónico', 'Email', true, '{"max":120,"format":"email"}', '[]', null),
  ('11111111-0000-4000-a000-000000000001', 4, 'text', 'address', 'Dirección', 'Address', true, '{"min":5,"max":200}', '[]', null),
  ('11111111-0000-4000-a000-000000000001', 5, 'textarea', 'note', 'Notas adicionales', 'Additional notes', false, '{"max":500}', '[]', null),
  -- Form 2: Suscripción soterrados (20)
  ('11111111-0000-4000-a000-000000000002', 1, 'text', 'firstName', 'Nombre', 'First name', true, '{"min":2,"max":60}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 2, 'text', 'lastName', 'Apellido', 'Last name', true, '{"min":2,"max":60}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 3, 'tel', 'phone', 'Teléfono', 'Phone', true, '{"min":7,"max":25,"format":"phone"}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 4, 'email', 'email', 'Correo electrónico', 'Email', true, '{"max":120,"format":"email"}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 5, 'text', 'unit', 'Apto/Unidad', 'Unit', false, '{"max":60}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 6, 'text', 'address', 'Dirección', 'Address', true, '{"min":5,"max":200}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 7, 'text', 'city', 'Ciudad', 'City', true, '{"min":2,"max":80}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 8, 'text', 'state', 'Estado', 'State', true, '{"max":20,"default":"PR"}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 9, 'text', 'zip', 'Código postal', 'ZIP', true, '{"min":3,"max":10}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 10, 'radio', 'gatedAccess', '¿Acceso controlado?', 'Gated access?', true, '{}', '[{"value":"yes","label_es":"Sí","label_en":"Yes"},{"value":"no","label_es":"No","label_en":"No"}]', null),
  ('11111111-0000-4000-a000-000000000002', 11, 'textarea', 'gatedInstructions', 'Instrucciones de acceso', 'Access instructions', false, '{"max":300}', '[]', '{"field":"gatedAccess","value":"yes"}'),
  ('11111111-0000-4000-a000-000000000002', 12, 'select', 'trashDay', 'Día de recogido de basura', 'Trash pickup day', true, '{}', '[{"value":"mon","label_es":"Lunes","label_en":"Monday"},{"value":"tue","label_es":"Martes","label_en":"Tuesday"},{"value":"wed","label_es":"Miércoles","label_en":"Wednesday"},{"value":"thu","label_es":"Jueves","label_en":"Thursday"},{"value":"fri","label_es":"Viernes","label_en":"Friday"},{"value":"sat","label_es":"Sábado","label_en":"Saturday"},{"value":"sun","label_es":"Domingo","label_en":"Sunday"}]', null),
  ('11111111-0000-4000-a000-000000000002', 13, 'select', 'trashTime', 'Horario de recogido', 'Pickup time', true, '{}', '[{"value":"morning","label_es":"Mañana","label_en":"Morning"},{"value":"afternoon","label_es":"Tarde","label_en":"Afternoon"},{"value":"evening","label_es":"Noche","label_en":"Evening"}]', null),
  ('11111111-0000-4000-a000-000000000002', 14, 'select', 'frequency', 'Frecuencia', 'Frequency', true, '{"default":"4w"}', '[{"value":"2w","label_es":"Cada 2 semanas","label_en":"Every 2 weeks"},{"value":"4w","label_es":"Cada 4 semanas","label_en":"Every 4 weeks"},{"value":"6w","label_es":"Cada 6 semanas","label_en":"Every 6 weeks"},{"value":"8w","label_es":"Cada 8 semanas","label_en":"Every 8 weeks"},{"value":"10w","label_es":"Cada 10 semanas","label_en":"Every 10 weeks"}]', null),
  ('11111111-0000-4000-a000-000000000002', 15, 'number', 'extraRegularBins', 'Zafacones regulares adicionales', 'Extra regular bins', false, '{"min":0,"max":20,"default":0}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 16, 'number', 'extraBuriedBins', 'Zafacones soterrados adicionales', 'Extra buried bins', false, '{"min":0,"max":20,"default":0}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 17, 'number', 'extraLids', 'Tapas adicionales', 'Extra lids', false, '{"min":0,"max":20,"default":0}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 18, 'checkbox', 'hydroJet', 'Añadir Hydro-Jet 250°', 'Add Hydro-Jet 250°', false, '{"default":false}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 19, 'checkbox', 'termsAccepted', 'Acepto las condiciones y restricciones de esta oferta', 'I accept terms and conditions', true, '{"default":false,"error_es":"Debes aceptar las condiciones para continuar.","error_en":"You must accept the terms to continue."}', '[]', null),
  ('11111111-0000-4000-a000-000000000002', 20, 'textarea', 'note', 'Notas adicionales', 'Additional notes', false, '{"max":500}', '[]', null)
) as v(form_id, oi, kind, fk, les, len, req, vr, opt, cond)
where exists (select 1 from public.tenants where id='61205cb9-1418-4bfa-a029-bbb44d4e4310')
on conflict (form_id, field_key) do nothing;

-- ══════════ PRICING RULES (UUIDs fijos) ══════════
insert into public.tenant_pricing_rules (id, tenant_id, applies_to_kind, rule_type, config, priority, is_active)
select v.id::uuid, '61205cb9-1418-4bfa-a029-bbb44d4e4310', v.k, v.rt, v.cfg::jsonb, v.pr, true
from (values
  ('22222222-0000-4000-a000-000000000001', 'service', 'matrix_2d',
   '{"axis_x":{"field":"frequency","values":["2w","4w","6w","8w","10w"]},"axis_y":{"field":"extraBuriedBins","values":[2,3,4,5,6]},"matrix":[[49.99,69.95,94.99,114.99,129.99],[49.99,69.95,94.99,114.99,129.99],[55,78,105,125,145],[60,85,115,135,160],[70,100,130,155,175]]}', 10),
  ('22222222-0000-4000-a000-000000000002', 'service', 'flat',
   '{"kind":"addons","extraLids":15,"extraRegularBins":24.99,"extraBuriedBins":24.99,"hydroJet":39.99}', 20),
  ('22222222-0000-4000-a000-000000000003', 'service', 'tiered_qty',
   '{"kind":"evaluation","individual":80,"condominio":200,"urb_small":260,"urb_large":500}', 10),
  ('22222222-0000-4000-a000-000000000004', 'service', 'flat',
   '{"kind":"one_time","painting":15}', 10),
  ('22222222-0000-4000-a000-000000000005', 'service', 'coupon',
   '{"code":"pXDGmo5K","first_cycle_price":19.98,"recurring_price":27.99}', 5)
) as v(id, k, rt, cfg, pr)
where exists (select 1 from public.tenants where id='61205cb9-1418-4bfa-a029-bbb44d4e4310')
on conflict (id) do nothing;

-- ══════════ COUPON (placeholder — modelo promo real vive en pricing_rule) ══════════
insert into public.tenant_coupons (tenant_id, code, discount_type, value, applies_to_kind, expires_at, max_uses, is_active)
select '61205cb9-1418-4bfa-a029-bbb44d4e4310', 'pXDGmo5K', 'fixed', 0, 'service', null, null, false
where exists (select 1 from public.tenants where id='61205cb9-1418-4bfa-a029-bbb44d4e4310')
on conflict (tenant_id, code) do nothing;

-- ══════════ PAYMENT METHODS (offline default + cash; Stripe/ATH inactivos hasta 2.7/2.8) ══════════
insert into public.tenant_payment_methods (tenant_id, method_key, is_active, is_default, display_name, display_order)
select '61205cb9-1418-4bfa-a029-bbb44d4e4310', v.mk, true, v.def, v.dn::jsonb, v.ord
from (values
  ('offline_coordination', true, '{"es":"Coordinar por WhatsApp","en":"Coordinate via WhatsApp"}', 1),
  ('cash_on_delivery', false, '{"es":"Efectivo al recibir","en":"Cash on delivery"}', 2)
) as v(mk, def, dn, ord)
where exists (select 1 from public.tenants where id='61205cb9-1418-4bfa-a029-bbb44d4e4310')
on conflict (tenant_id, method_key) do nothing;
