-- Migración 155: Instalación Soterrados extended (Q4). Clona campos comunes 1:1 EXACTO desde Suscripción soterrados
-- (mismo copy/validation/options/conditional) → cero error de transcripción. Idempotente: delete de los field_keys
-- clonados + 'name', luego insert-select; update de phone/email/address/installQty/disclaimer/note. Solo Zafacones.
-- Cero cambios en pricing/RPCs. SMS = helper de phone (consistente con Soterrados). termsAccepted añadido (alto ticket).

-- 1. Borra 'name' (reemplazado por firstName+lastName) + los clonados (reinsert idempotente).
delete from public.tenant_order_form_fields
  where form_id = '33333333-0000-4000-a000-000000000003'
    and field_key in ('name','firstName','lastName','unit','city','state','zip','gatedAccess','gatedInstructions','termsAccepted');

-- 2. Clona los 9 campos comunes desde Soterrados con order_index del extended.
insert into public.tenant_order_form_fields
  (tenant_id, form_id, order_index, kind, field_key, label_es, label_en, placeholder_es, placeholder_en,
   required, validation_rules, options, conditional_on, group_name, group_description_es, group_description_en)
select tenant_id, '33333333-0000-4000-a000-000000000003',
  case field_key when 'firstName' then 10 when 'lastName' then 20 when 'unit' then 60 when 'city' then 70
    when 'state' then 80 when 'zip' then 90 when 'gatedAccess' then 100 when 'gatedInstructions' then 110
    when 'termsAccepted' then 230 end,
  kind, field_key, label_es, label_en, placeholder_es, placeholder_en, required, validation_rules, options,
  conditional_on, group_name, group_description_es, group_description_en
from public.tenant_order_form_fields
where form_id = '11111111-0000-4000-a000-000000000002'
  and field_key in ('firstName','lastName','unit','city','state','zip','gatedAccess','gatedInstructions','termsAccepted');

-- 3. phone/email/address: clon exacto (copy+placeholder+helper) desde Soterrados + order del extended.
update public.tenant_order_form_fields i set order_index = 30, label_es = s.label_es, label_en = s.label_en,
  placeholder_es = s.placeholder_es, placeholder_en = s.placeholder_en, validation_rules = s.validation_rules
  from (select * from public.tenant_order_form_fields where form_id = '11111111-0000-4000-a000-000000000002' and field_key = 'phone') s
  where i.form_id = '33333333-0000-4000-a000-000000000003' and i.field_key = 'phone';
update public.tenant_order_form_fields i set order_index = 40, placeholder_es = s.placeholder_es, placeholder_en = s.placeholder_en
  from (select * from public.tenant_order_form_fields where form_id = '11111111-0000-4000-a000-000000000002' and field_key = 'email') s
  where i.form_id = '33333333-0000-4000-a000-000000000003' and i.field_key = 'email';
update public.tenant_order_form_fields i set order_index = 50, label_es = s.label_es, label_en = s.label_en,
  placeholder_es = s.placeholder_es, placeholder_en = s.placeholder_en, validation_rules = s.validation_rules
  from (select * from public.tenant_order_form_fields where form_id = '11111111-0000-4000-a000-000000000002' and field_key = 'address') s
  where i.form_id = '33333333-0000-4000-a000-000000000003' and i.field_key = 'address';

-- 4. Preserva installQty + disclaimer 'Incluye' + note: reordena + agrupa en "Instalación".
update public.tenant_order_form_fields set order_index = 200, group_name = 'Instalación'
  where form_id = '33333333-0000-4000-a000-000000000003' and field_key = 'installQty';
update public.tenant_order_form_fields set order_index = 210, group_name = 'Instalación'
  where form_id = '33333333-0000-4000-a000-000000000003' and field_key = '_disc_includes';
update public.tenant_order_form_fields set order_index = 220
  where form_id = '33333333-0000-4000-a000-000000000003' and field_key = 'note';
