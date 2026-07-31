-- OFERTAS-HOOK-STRIPE 2b1: términos legales por-oferta + firma digital de aceptación + plumbing de offer_id.
-- (El billing real — coupon-once + reversión + email — es 2b2, con test clock del owner. Seguro, no toca dinero.)
-- 1) terms_es/en en la oferta (texto legal completo, editable en CMS; ** = bold en el acordeón).
-- 2) offer_id en el pedido (correlación + lo consume 2b2 en el checkout).
-- 3) _public_create_order guarda offer_id y, si viene, registra la aceptación firmada en audit_log
--    (action='subscription_terms_accepted', ip/user_agent del pedido, terms_hash sha256 — Ley 148-2004 PR).
-- 4) La oferta activa del owner (creada en el CMS) se DESACTIVA hasta 2b2 (evita promesa falsa) + se le cargan
--    los términos legales completos.
alter table public.tenant_landing_offers add column if not exists terms_es text not null default '';
alter table public.tenant_landing_offers add column if not exists terms_en text not null default '';
alter table public.tenant_landing_orders add column if not exists offer_id uuid;

CREATE OR REPLACE FUNCTION public._public_create_order(_hostname text, _payload jsonb, _client_ip text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare _t uuid; _form record; _pm record; _valid jsonb; _calc jsonb; _idem uuid; _ex record;
        _items jsonb := coalesce(_payload->'items','[]'::jsonb); _cf jsonb := coalesce(_payload->'custom_fields','{}'::jsonb);
        _pmk text := _payload->>'payment_method_key'; _coupon text := nullif(_payload->>'coupon_code','');
        _offer_id uuid := nullif(_payload->>'offer_id','')::uuid; _terms text;
        _ctotal numeric; _stotal numeric; _id uuid; _num text; _otype text; _freq text; _cid uuid; _nm text; _tok text;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','invalid_origin'); end if;
  if not public._landing_rl('order:'||coalesce(_client_ip,'')||':'||coalesce(_hostname,''), 5) then
    return jsonb_build_object('status','error','code','rate_limited'); end if;
  select * into _form from public.tenant_order_forms where id=(_payload->>'form_id')::uuid and tenant_id=_t and is_active;
  if not found then return jsonb_build_object('status','error','code','form_invalid'); end if;
  _idem := nullif(_payload->>'idempotency_key','')::uuid;
  if _idem is not null then
    select id, order_number, public_token into _ex from public.tenant_landing_orders where idempotency_key=_idem and tenant_id=_t;
    if found then return jsonb_build_object('status','ok','order_number',_ex.order_number,'order_id',_ex.id,'public_token',_ex.public_token,'idempotent',true); end if;
  end if;
  if _pmk = 'stripe' then
    if not exists (select 1 from public.tenant_payment_config where tenant_id=_t and stripe_enabled) then
      return jsonb_build_object('status','error','code','payment_method_invalid'); end if;
  else
    select * into _pm from public.tenant_payment_methods where tenant_id=_t and method_key=_pmk and is_active;
    if not found then return jsonb_build_object('status','error','code','payment_method_invalid'); end if;
  end if;
  _valid := public.validate_order_form_data(_form.id, _cf);
  if not (_valid->>'valid')::boolean then return jsonb_build_object('status','error','code','form_invalid','errors',_valid->'errors'); end if;
  if _coupon is not null and not exists (select 1 from public.tenant_coupons where tenant_id=_t and code=_coupon and is_active and (expires_at is null or expires_at>now()) and (max_uses is null or current_uses<max_uses)) then
    return jsonb_build_object('status','error','code','coupon_invalid'); end if;
  _calc := public._public_price_order(_t, _items, _cf, _coupon);
  _stotal := (_calc->>'total')::numeric;
  _ctotal := nullif(_payload->>'client_total','')::numeric;
  if _ctotal is not null and abs(_ctotal - _stotal) > 0.01 then
    insert into public.tenant_audit_log(tenant_id,entity_type,action,changes)
      values(_t,'order_total_mismatch','reject',jsonb_build_object('client',_ctotal,'server',_stotal,'ip',_client_ip,'items',_items));
    return jsonb_build_object('status','error','code','total_mismatch'); end if;
  _freq := nullif(_cf->>'frequency','');
  _otype := case when _freq is not null then 'subscription' else 'one_time' end;
  _nm := coalesce(nullif(trim(coalesce(_cf->>'name', trim(coalesce(_cf->>'firstName','')||' '||coalesce(_cf->>'lastName','')))),''),'Cliente web');
  _num := public.next_order_number(_t);
  insert into public.tenant_landing_orders(tenant_id,order_number,status,payment_method_key,payment_status,order_type,billing_frequency,form_id,
    customer_name,customer_email,customer_phone,customer_address,items,custom_fields,pricing_breakdown,
    subtotal,tax,shipping,discount,total,currency,idempotency_key,source_ip,source_hostname,user_agent,referrer,offer_id)
  values(_t,_num,'pending',_pmk,'unpaid',_otype,_freq,_form.id,_nm,_cf->>'email',_cf->>'phone',
    jsonb_build_object('address',_cf->>'address','unit',_cf->>'unit','city',_cf->>'city','state',_cf->>'state','zip',_cf->>'zip'),
    _items,_cf,_calc,(_calc->>'subtotal')::numeric,(_calc->>'tax')::numeric,(_calc->>'shipping')::numeric,(_calc->>'discount')::numeric,
    _stotal,'USD',_idem,_client_ip,_hostname,_payload->>'user_agent',_payload->>'referrer',_offer_id)
  returning id, public_token into _id, _tok;
  if _coupon is not null then
    select id into _cid from public.tenant_coupons where tenant_id=_t and code=_coupon and is_active;
    if _cid is not null then insert into public.coupon_redemptions(tenant_id,coupon_id,order_id) values(_t,_cid,_id); end if;
  end if;
  if _offer_id is not null then  -- firma digital de aceptación de términos (Ley 148-2004 PR)
    select coalesce(o.terms_es,'')||'|'||coalesce(o.terms_en,'') into _terms from public.tenant_landing_offers o where o.id=_offer_id and o.tenant_id=_t;
    insert into public.audit_log(tenant_id, action, entity_type, entity_id, ip_address, user_agent, new_values, risk_level)
    values(_t, 'subscription_terms_accepted', 'offer', _offer_id, _client_ip, _payload->>'user_agent',
      jsonb_build_object('order_id',_id,'customer_name',_nm,'customer_email',_cf->>'email',
        'terms_hash', encode(sha256(convert_to(coalesce(_terms,''),'UTF8')),'hex'), 'accepted_at', now()), 'low');
  end if;
  return jsonb_build_object('status','ok','order_number',_num,'order_id',_id,'public_token',_tok);
end $function$
;

-- La oferta de Zafacones (creada por el owner en el CMS) ya está activa pero 2b2 (billing) no existe → se
-- DESACTIVA hasta 2b2 (evita la promesa falsa) y se le cargan los términos legales completos (** = bold).
update public.tenant_landing_offers set
  is_active = false,
  title_es = coalesce(nullif(title_es,''),'Club Membresía Ramos'), title_en = coalesce(nullif(title_en,''),'Ramos Membership Club'),
  disclosure_es = coalesce(nullif(disclosure_es,''),'Primer mes $19.98. Compromiso mínimo de 3 ciclos. Lee los términos completos antes de aceptar.'),
  disclosure_en = coalesce(nullif(disclosure_en,''),'First month $19.98. Minimum 3-cycle commitment. Read the full terms before accepting.'),
  terms_es = $terms_es$TÉRMINOS Y CONDICIONES DE LA OFERTA PROMOCIONAL DE SUSCRIPCIÓN

Zafacones Ramos, con oficina principal en San Juan, Puerto Rico, ofrece al cliente ("el Suscriptor") acceso a servicios de limpieza recurrente de zafacones bajo los siguientes términos:

1. PRECIO PROMOCIONAL DE BIENVENIDA
Al suscribirte al plan de membresía a través de esta oferta promocional, obtienes un precio especial de $19.98 durante tu primer ciclo de servicio. **Este precio promocional aplica ÚNICAMENTE al primer ciclo; a partir del segundo ciclo se te cobrará automáticamente el precio regular del servicio contratado (Membresía Regular $39.99 o Membresía Soterrados $69.95, según aplique) cada 4 semanas.**

2. COMPROMISO MÍNIMO DE 3 CICLOS
**Al aceptar el precio promocional, el Suscriptor acepta un compromiso mínimo de 3 ciclos consecutivos de suscripción.** Este compromiso es la contraprestación por el descuento sustancial otorgado en el primer ciclo. El compromiso comienza el día del primer cobro exitoso.

3. CANCELACIÓN ANTICIPADA Y REVERSIÓN DEL DESCUENTO
**Si el Suscriptor cancela la suscripción ANTES de completar los 3 ciclos comprometidos, Zafacones Ramos cobrará automáticamente la reversión del descuento promocional otorgado.** El monto de la reversión se calcula así:

**Reversión = Precio Regular del Servicio − $19.98 (Precio Promocional)**

Ejemplos:
- Membresía Regular: Reversión = $39.99 − $19.98 = $20.01
- Membresía Soterrados: Reversión = $69.95 − $19.98 = $49.97

Esta cláusula NO constituye una penalidad ni multa por cancelación; es la reversión del descuento promocional otorgado bajo la expectativa del compromiso mínimo. El Suscriptor reconoce que este mecanismo es justo y proporcional, análogo a los descuentos condicionados por compromiso que se utilizan en telecomunicaciones, gimnasios y servicios de suscripción similares en Puerto Rico.

4. CANCELACIÓN DESPUÉS DEL COMPROMISO
**Después de completar los 3 ciclos comprometidos, el Suscriptor puede cancelar la suscripción en cualquier momento sin cargos adicionales.** La cancelación tomará efecto al final del ciclo pagado en curso; el servicio permanecerá activo hasta esa fecha sin cargos adicionales.

5. RENOVACIÓN AUTOMÁTICA
El Suscriptor autoriza expresamente el cobro automático recurrente cada 4 semanas al método de pago registrado. Esta autorización permanece vigente hasta que el Suscriptor cancele activamente la suscripción. El Suscriptor puede actualizar su método de pago en cualquier momento desde el portal del cliente o contactando directamente a Zafacones Ramos.

6. FALLO DE PAGO
Si un cobro recurrente falla (tarjeta rechazada, fondos insuficientes, etc.), Zafacones Ramos intentará el cobro nuevamente hasta 3 veces durante los siguientes 7 días. Si todos los intentos fallan, la suscripción quedará suspendida temporalmente. Si el Suscriptor no actualiza su método de pago dentro de los 14 días siguientes, la suscripción será cancelada automáticamente, y si esta cancelación ocurre antes de completar los 3 ciclos comprometidos, aplicará la reversión del descuento descrita en el numeral 3.

7. SERVICIOS INCLUIDOS
La membresía incluye limpieza recurrente de los zafacones especificados en la selección del Suscriptor (Regular o Soterrados) con la frecuencia elegida. Los adicionales (zafacones extra, hydro-jet, etc.) son opcionales y cobrados por separado a los precios vigentes al momento de la compra.

8. GARANTÍA DE SERVICIO
Zafacones Ramos se compromete a prestar el servicio con calidad profesional y cumpliendo estándares del sector. Si el Suscriptor no está satisfecho con un servicio específico, puede contactar a Zafacones Ramos dentro de las 48 horas siguientes al servicio para solicitar reprogramación o corrección sin costo adicional.

9. COMUNICACIONES
El Suscriptor autoriza a Zafacones Ramos a enviar comunicaciones transaccionales relacionadas con la suscripción (confirmaciones, recordatorios, alertas de cobro, notificaciones de servicio) al email y teléfono provistos. El Suscriptor puede optar por no recibir comunicaciones promocionales en cualquier momento.

10. PROTECCIÓN AL CONSUMIDOR
Estos términos se rigen por las leyes del Estado Libre Asociado de Puerto Rico, incluyendo la Ley Núm. 5 de 1973 del Departamento de Asuntos del Consumidor (DACO), la Ley Núm. 148 de 2004 de Firma Digital y Comercio Electrónico, y demás legislación aplicable. Cualquier disputa será resuelta primeramente mediante comunicación directa entre las partes; si no se logra acuerdo, las partes podrán acudir a los mecanismos alternos de resolución de disputas ofrecidos por DACO o los tribunales competentes en San Juan, Puerto Rico.

11. ACEPTACIÓN ELECTRÓNICA
**Al marcar la casilla de aceptación en el proceso de suscripción y proceder al pago, el Suscriptor manifiesta su aceptación expresa, informada y libre de estos términos.** Esta aceptación electrónica tiene plena validez legal bajo la Ley Núm. 148 de 2004. Un registro digital de esta aceptación (con fecha, hora, IP y datos técnicos) será enviado por email al Suscriptor como constancia formal.

12. CONTACTO
Para cualquier pregunta, cambio o cancelación, contactar directamente a Zafacones Ramos por WhatsApp, email o teléfono según la información publicada en www.zramos.com.$terms_es$,
  terms_en = $terms_en$SUBSCRIPTION PROMOTIONAL OFFER TERMS AND CONDITIONS

Zafacones Ramos, based in San Juan, Puerto Rico, offers customers ("the Subscriber") access to recurring bin cleaning services under the following terms:

1. PROMOTIONAL WELCOME PRICE
By subscribing to the membership plan through this promotional offer, you obtain a special price of $19.98 during your first service cycle. **This promotional price applies ONLY to the first cycle; starting from the second cycle you will be automatically charged the regular service price (Regular Membership $39.99 or Underground Membership $69.95, as applicable) every 4 weeks.**

2. MINIMUM COMMITMENT OF 3 CYCLES
**By accepting the promotional price, the Subscriber accepts a minimum commitment of 3 consecutive subscription cycles.** This commitment is the consideration for the substantial discount granted in the first cycle. The commitment begins on the day of the first successful charge.

3. EARLY CANCELLATION AND DISCOUNT REVERSAL
**If the Subscriber cancels the subscription BEFORE completing the 3 committed cycles, Zafacones Ramos will automatically charge the reversal of the promotional discount granted.** The reversal amount is calculated as follows:

**Reversal = Regular Service Price − $19.98 (Promotional Price)**

Examples:
- Regular Membership: Reversal = $39.99 − $19.98 = $20.01
- Underground Membership: Reversal = $69.95 − $19.98 = $49.97

This clause does NOT constitute a penalty or cancellation fine; it is the reversal of the promotional discount granted under the expectation of minimum commitment. The Subscriber acknowledges that this mechanism is fair and proportional, analogous to commitment-conditioned discounts used in telecommunications, gyms, and similar subscription services in Puerto Rico.

4. CANCELLATION AFTER COMMITMENT
**After completing the 3 committed cycles, the Subscriber may cancel the subscription at any time without additional charges.** The cancellation will take effect at the end of the current paid cycle; service will remain active until that date with no additional charges.

5. AUTOMATIC RENEWAL
The Subscriber expressly authorizes recurring automatic charging every 4 weeks to the registered payment method. This authorization remains valid until the Subscriber actively cancels the subscription. The Subscriber may update the payment method at any time through the customer portal or by contacting Zafacones Ramos directly.

6. PAYMENT FAILURE
If a recurring charge fails (declined card, insufficient funds, etc.), Zafacones Ramos will retry the charge up to 3 times over the following 7 days. If all attempts fail, the subscription will be temporarily suspended. If the Subscriber does not update the payment method within 14 days, the subscription will be automatically cancelled, and if this cancellation occurs before completing the 3 committed cycles, the discount reversal described in section 3 will apply.

7. INCLUDED SERVICES
The membership includes recurring cleaning of the bins specified in the Subscriber's selection (Regular or Underground) at the chosen frequency. Add-ons (extra bins, hydro-jet, etc.) are optional and charged separately at the prices in effect at the time of purchase.

8. SERVICE GUARANTEE
Zafacones Ramos commits to providing service with professional quality and meeting industry standards. If the Subscriber is not satisfied with a specific service, they may contact Zafacones Ramos within 48 hours following the service to request rescheduling or correction at no additional cost.

9. COMMUNICATIONS
The Subscriber authorizes Zafacones Ramos to send transactional communications related to the subscription (confirmations, reminders, billing alerts, service notifications) to the email and phone provided. The Subscriber may opt out of promotional communications at any time.

10. CONSUMER PROTECTION
These terms are governed by the laws of the Commonwealth of Puerto Rico, including Act No. 5 of 1973 of the Department of Consumer Affairs (DACO), Act No. 148 of 2004 on Digital Signatures and Electronic Commerce, and other applicable legislation. Any dispute will first be resolved through direct communication between the parties; if no agreement is reached, the parties may resort to alternative dispute resolution mechanisms offered by DACO or the competent courts in San Juan, Puerto Rico.

11. ELECTRONIC ACCEPTANCE
**By checking the acceptance box in the subscription process and proceeding to payment, the Subscriber manifests express, informed, and free acceptance of these terms.** This electronic acceptance has full legal validity under Act No. 148 of 2004. A digital record of this acceptance (with date, time, IP, and technical data) will be sent by email to the Subscriber as formal proof.

12. CONTACT
For any questions, changes, or cancellations, contact Zafacones Ramos directly by WhatsApp, email, or phone according to the information published at www.zramos.com.$terms_en$
where id = '82236b35-e82e-435b-bab0-22bddd9333cf' and tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310';
