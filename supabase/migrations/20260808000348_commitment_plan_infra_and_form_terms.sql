-- MIGR 348 — HYDROJET-COMMERCIAL-V2 sub-rodaja v2a (parte SEGURA: cero cambios de dinero).
-- Prepara la infraestructura genérica para commitments (reusable en servicios/productos/membresías) sin activar
-- todavía el descuento (v2b) ni el fee de cancelación (v2c).
-- (1) Cosmético del form Hydro-Jet (labels de tamaño/dirección/suite).
-- (2) Campos nuevos: trashDay + trashTime (copiados 1:1 de Suscripción soterrados) y planType (5 opciones).
--     ⚠️ GUARD: las 4 opciones de PLAN nacen `disabled:true` en el jsonb → la UI solo deja elegir "Servicio único"
--     hasta que los términos legales REALES estén sembrados (v2b). Impide firmar un contrato con placeholder.
-- (3) Regla `commitment_plan` atada al servicio: la config se PERSISTE pero el motor NO la lee todavía → el precio
--     efectivo sigue siendo el de migr 347 (sin descuento). Verificable: Hydro-Jet 2yd x1 = $105.00.
-- (4) Términos generalizados: tenant_order_forms.terms_es/en (nullable). Las ofertas siguen leyendo de
--     tenant_landing_offers.terms_es/en (intacto); un form sin términos se comporta igual que antes.
--     _send_subscription_acceptance_email acepta el form como fuente alternativa a offer_id, con audit
--     'terms_source_missing' (low) si no hay contrato en ninguna fuente (patrón migr 344).
-- NO se toca: _public_price_order, create_stripe_subscription_checkout, process_subscription_event, el form
-- "Compra simple", el add-on hydroJet de las Membresías, ni órdenes históricas.
-- El CHECK de rule_type no contemplaba el tipo nuevo: se re-crea agregando 'commitment_plan' (aditivo, los 8
-- valores existentes se preservan tal cual).
alter table public.tenant_pricing_rules drop constraint if exists tenant_pricing_rules_rule_type_check;
alter table public.tenant_pricing_rules add constraint tenant_pricing_rules_rule_type_check
  check (rule_type = any (array['flat','tiered_qty','matrix_2d','matrix_1d','percentage_discount','coupon','tax','shipping','commitment_plan']));
alter table public.tenant_order_forms add column if not exists terms_es text;
alter table public.tenant_order_forms add column if not exists terms_en text;

-- ── (1) Cosmético ─────────────────────────────────────────────────────────────────────────────────────
update public.tenant_order_form_fields set
  label_es = 'Dirección completa de su negocio', label_en = 'Complete business address'
 where form_id = '44444444-0000-4000-a000-000000000001' and field_key = 'address';
update public.tenant_order_form_fields set
  label_es = 'Suite / Piso / Local', label_en = 'Suite / Floor / Unit'
 where form_id = '44444444-0000-4000-a000-000000000001' and field_key = 'unit';
update public.tenant_order_form_fields set options = (
  select jsonb_agg(o || jsonb_build_object(
    'label_es','Contenedor '||replace(o->>'value','yd',' yd³'),
    'label_en','Container '||replace(o->>'value','yd',' yd³')))
  from jsonb_array_elements(options) o)
 where form_id = '44444444-0000-4000-a000-000000000001' and field_key = 'containerSize';

-- ── (2) Campos nuevos: día y turno copiados de Suscripción soterrados ─────────────────────────────────
insert into public.tenant_order_form_fields (tenant_id, form_id, order_index, kind, field_key, label_es, label_en,
  required, validation_rules, options, group_name)
select f.tenant_id, '44444444-0000-4000-a000-000000000001', case f.field_key when 'trashDay' then 150 else 160 end, f.kind, f.field_key,
       case f.field_key when 'trashDay' then 'Día de servicio' else 'Turno' end,
       case f.field_key when 'trashDay' then 'Service day' else 'Shift' end,
       true, f.validation_rules, f.options, 'Opciones de Servicio'
from public.tenant_order_form_fields f
where f.form_id = '11111111-0000-4000-a000-000000000002' and f.field_key in ('trashDay','trashTime')
  and not exists (select 1 from public.tenant_order_form_fields x where x.form_id='44444444-0000-4000-a000-000000000001' and x.field_key=f.field_key);

-- ── planType: default 'once'; los planes quedan DISABLED hasta que existan términos reales (v2b) ───────
insert into public.tenant_order_form_fields (tenant_id, form_id, order_index, kind, field_key, label_es, label_en,
  required, validation_rules, options, group_name)
values ('61205cb9-1418-4bfa-a029-bbb44d4e4310','44444444-0000-4000-a000-000000000001',170,'select','planType',
  'Modalidad de servicio','Service plan', true,
  '{"default":"once","helper_es":"Los planes con descuento se habilitan próximamente.","helper_en":"Discounted plans coming soon."}'::jsonb,
  '[{"value":"once","label_es":"Servicio único","label_en":"One-time service"},
    {"value":"plan3","label_es":"Plan 3 meses (10% off)","label_en":"3-month plan (10% off)","disabled":true},
    {"value":"plan6","label_es":"Plan 6 meses (11% off)","label_en":"6-month plan (11% off)","disabled":true},
    {"value":"plan9","label_es":"Plan 9 meses (14% off)","label_en":"9-month plan (14% off)","disabled":true},
    {"value":"plan12","label_es":"Plan 12 meses (15% off)","label_en":"12-month plan (15% off)","disabled":true}]'::jsonb,
  'Opciones de Servicio')
on conflict do nothing;

-- ── (3) Regla commitment_plan: se persiste, el motor todavía NO la aplica (v2b) ────────────────────────
insert into public.tenant_pricing_rules (tenant_id, applies_to_kind, applies_to_id, rule_type, config, priority, is_active)
select '61205cb9-1418-4bfa-a029-bbb44d4e4310','service','66666666-0000-4000-a000-000000000005','commitment_plan',
  jsonb_build_object('field_name','planType','billing','4w','tiers', jsonb_build_array(
    jsonb_build_object('value','once','discount_pct',0,'commitment',0,'cancel_fee_cycles',0),
    jsonb_build_object('value','plan3','discount_pct',10,'commitment',3,'cancel_fee_cycles',1),
    jsonb_build_object('value','plan6','discount_pct',11,'commitment',6,'cancel_fee_cycles',1),
    jsonb_build_object('value','plan9','discount_pct',14,'commitment',9,'cancel_fee_cycles',1),
    jsonb_build_object('value','plan12','discount_pct',15,'commitment',12,'cancel_fee_cycles',1))),
  10, true
where not exists (select 1 from public.tenant_pricing_rules r where r.applies_to_id='66666666-0000-4000-a000-000000000005' and r.rule_type='commitment_plan');

-- ── (4) Placeholder legible de términos (el texto legal real lo siembra el owner en v2b) ──────────────
update public.tenant_order_forms
   set terms_es = 'PENDIENTE_v2b — Términos legales serán insertados antes de activar planes recurrentes.',
       terms_en = 'PENDING_v2b — Legal terms will be inserted before enabling recurring plans.'
 where id = '44444444-0000-4000-a000-000000000001' and coalesce(terms_es,'') = '';

CREATE OR REPLACE FUNCTION public._send_subscription_acceptance_email(_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare _o public.tenant_landing_orders%rowtype; _key text; _name text; _off record; _sig jsonb; _sig_ip text; _sig_ua text; _html text; _terms text;
  _pr text; _status int; _resp text;
begin
  select * into _o from public.tenant_landing_orders where id=_order_id;
  if _o.acceptance_email_sent_at is not null or coalesce(_o.customer_email,'')='' then return; end if;
  select coalesce(nullif(trim(t.display_name),''), t.legal_name, 'NÚCLEO') into _name from public.tenants t where t.id=_o.tenant_id;
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _key is null then return; end if;
  if _o.offer_id is not null then
    select hook_price, commitment_cycles, terms_es into _off from public.tenant_landing_offers where id=_o.offer_id;
  else  -- fuente alternativa: contrato firmable del propio form (v2a, generaliza el patrón de las ofertas)
    select null::numeric, null::int, f.terms_es into _off from public.tenant_order_forms f where f.id=_o.form_id;
  end if;
  if coalesce(_off.terms_es,'') = '' then  -- sin contrato en ninguna fuente: no hay nada que certificar
    insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
      values(_o.tenant_id,'terms_source_missing','order',_order_id,jsonb_build_object('form_id',_o.form_id,'offer_id',_o.offer_id),'low');
    return;
  end if;
  select new_values, ip_address, user_agent into _sig, _sig_ip, _sig_ua from public.audit_log where action='subscription_terms_accepted'
    and entity_id=_o.offer_id and new_values->>'order_id'=_order_id::text order by created_at desc limit 1;
  _pr := to_char((coalesce((_sig->>'accepted_at')::timestamptz, now()) at time zone 'America/Puerto_Rico'),'DD/MM/YYYY HH24:MI');
  _terms := regexp_replace(replace(public._html_escape(coalesce(_off.terms_es,'')), E'\n', '<br>'), '\*\*(.*?)\*\*', '<strong>\1</strong>', 'g');
  _html := '<div style="max-width:640px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111827">'
    || '<h2 style="color:#16a34a">Confirmación de Suscripción y Aceptación de Términos</h2>'
    || '<p>Estimado/a <strong>'||public._html_escape(coalesce(_o.customer_name,'Cliente'))||'</strong>,</p>'
    || '<p>Este email es tu constancia formal de aceptación de los términos de tu suscripción con '||public._html_escape(_name)||'.</p>'
    || '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:13px">'
    || '<p><strong>Detalles de la aceptación:</strong></p>'
    || '<ul><li>Nombre: '||public._html_escape(coalesce(_o.customer_name,''))||'</li>'
    || '<li>Email: '||public._html_escape(coalesce(_o.customer_email,''))||'</li>'
    || '<li>Fecha y hora: '||_pr||' (Hora de Puerto Rico)</li>'
    || '<li>Dirección IP: '||public._html_escape(coalesce(_sig_ip, _o.source_ip, ''))||'</li>'
    || '<li>Dispositivo: '||public._html_escape(coalesce(_sig_ua, _o.user_agent, ''))||'</li>'
    || '<li>Ubicación de firma: San Juan, Puerto Rico</li>'
    || '<li>Servicio: '||public._html_escape(coalesce(_o.items->0->>'name',''))||'</li>'
    || '<li>Precio promocional (1er ciclo): $'||to_char(coalesce(_off.hook_price,0),'FM999990.00')||'</li>'
    || '<li>Precio regular (ciclos 2+): $'||to_char(coalesce(_o.total,0),'FM999990.00')||'</li>'
    || '<li>Compromiso mínimo: '||coalesce(_off.commitment_cycles,3)||' ciclos</li>'
    || '<li>Firma digital (hash): '||public._html_escape(coalesce(_sig->>'terms_hash',''))||'</li></ul></div>'
    || '<p style="font-size:13px">Yo, '||public._html_escape(coalesce(_o.customer_name,''))||', acepté los siguientes Términos y Condiciones:</p>'
    || '<div style="font-size:11px;color:#374151;border:1px solid #e5e7eb;border-radius:8px;padding:12px;line-height:1.5">'||_terms||'</div>'
    || '<p style="font-size:12px;color:#6b7280">Documento con validez legal bajo la Ley Núm. 148 de 2004 de Firma Digital y Comercio Electrónico de Puerto Rico. San Juan, Puerto Rico · '||_pr||'</p>'
    || '<p style="font-size:12px;color:#9ca3af">'||public._html_escape(_name)||'</p></div>';
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)],'application/json',
    jsonb_build_object('from',_name||' <noreply@raisen.agency>','to',_o.customer_email,
      'subject','Confirmación de Suscripción y Aceptación de Términos · '||_name,'html',_html)::text)::http_request);
  if _status between 200 and 299 then
    update public.tenant_landing_orders set acceptance_email_sent_at=now() where id=_order_id;
    insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
      values(_o.tenant_id,'acceptance_email_sent','order',_order_id,jsonb_build_object('email',_o.customer_email),'low');
  end if;
exception when others then raise warning '_send_subscription_acceptance_email EXC % order=%', sqlerrm, _order_id;
end $function$
;
