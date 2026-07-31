-- OFERTAS-HOOK-STRIPE 2b2.5: fix de display del "total hoy" en los artefactos de cliente (página/PDF/email orden)
-- cuando el pedido tiene offer_id + captura de la IP real (email de aceptación). Money-safe: no toca cálculos ni Stripe.
-- El total interno del pedido guarda el precio REGULAR; el display divide "total pagado hoy" (hook) vs "próximo ciclo".
-- 1) get_public_order: expone offer_hook (hook_price de la oferta) para la página + PDF.
-- 2) _public_create_order: captura la IP real de request.headers x-forwarded-for (el browser manda _client_ip=null).
-- 3) _send_order_confirmation_email: total offer-aware (hoy vs próximo ciclo).
-- 4) _send_subscription_acceptance_email: lee ip_address/user_agent de la COLUMNA del audit_log (no de new_values).
CREATE OR REPLACE FUNCTION public.get_public_order(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare _o record; _hash text;
begin
  _hash := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if public._public_rate_hit(_hash) > 30 then return jsonb_build_object('status', 'rate_limited'); end if;
  select o.order_number, o.customer_name, o.customer_phone, o.customer_email, o.customer_address, o.items,
         o.subtotal, o.tax, o.shipping, o.discount, o.total, o.status, o.created_at, o.billing_frequency,
         o.source_hostname, o.custom_fields, o.offer_id, off.hook_price as offer_hook, t.display_name, t.legal_name, t.contact_phone,
         th.primary_color, th.accent_color, th.logo_url
    into _o from public.tenant_landing_orders o
    join public.tenants t on t.id = o.tenant_id
    left join public.tenant_landing_offers off on off.id = o.offer_id
    left join public.tenant_themes th on th.tenant_id = o.tenant_id
    where o.public_token = p_token;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  return jsonb_build_object('status', 'valid',
    'order', jsonb_build_object('order_number', _o.order_number, 'customer_name', _o.customer_name, 'phone', _o.customer_phone,
      'email', _o.customer_email, 'address', _o.customer_address, 'items', _o.items, 'subtotal', _o.subtotal, 'tax', _o.tax,
      'shipping', _o.shipping, 'discount', _o.discount, 'total', _o.total, 'status', _o.status, 'created_at', _o.created_at,
      'billing_frequency', _o.billing_frequency, 'source', _o.source_hostname, 'custom_fields', _o.custom_fields,
      'offer_hook', _o.offer_hook),
    'tenant', jsonb_build_object('display_name', _o.display_name, 'legal_name', _o.legal_name, 'contact_phone', _o.contact_phone,
      'primary_color', coalesce(_o.primary_color, '#1a1a2e'), 'accent_color', coalesce(_o.accent_color, '#4a4a6a'), 'logo_url', _o.logo_url));
end $function$
;

CREATE OR REPLACE FUNCTION public._public_create_order(_hostname text, _payload jsonb, _client_ip text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare _t uuid; _form record; _pm record; _valid jsonb; _calc jsonb; _idem uuid; _ex record;
        _items jsonb := coalesce(_payload->'items','[]'::jsonb); _cf jsonb := coalesce(_payload->'custom_fields','{}'::jsonb);
        _pmk text := _payload->>'payment_method_key'; _coupon text := nullif(_payload->>'coupon_code','');
        _offer_id uuid := nullif(_payload->>'offer_id','')::uuid; _terms text; _hdr jsonb;
        _ctotal numeric; _stotal numeric; _id uuid; _num text; _otype text; _freq text; _cid uuid; _nm text; _tok text;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','invalid_origin'); end if;
  _hdr := nullif(current_setting('request.headers', true),'')::jsonb;
  _client_ip := coalesce(nullif(_client_ip,''), split_part(_hdr->>'x-forwarded-for', ',', 1));
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

CREATE OR REPLACE FUNCTION public._send_order_confirmation_email(_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare _o public.tenant_landing_orders%rowtype; _key text; _name text; _instr text; _items text := ''; _it jsonb; _html text; _status int; _resp text; _hook numeric;
begin
  select * into _o from public.tenant_landing_orders where id = _order_id;
  if _o.confirmation_email_sent_at is not null or coalesce(_o.customer_email,'') = '' then return; end if;
  if _o.offer_id is not null then select hook_price into _hook from public.tenant_landing_offers where id=_o.offer_id; end if;
  select coalesce(nullif(trim(t.display_name),''), t.legal_name, 'NÚCLEO') into _name from public.tenants t where t.id=_o.tenant_id;
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _key is null then raise warning '_send_order_confirmation_email sin key order=%', _order_id; return; end if;
  _instr := case _o.payment_method_key
    when 'offline_coordination' then 'Un representante te contactará en menos de 24 horas para coordinar el pago vía WhatsApp.'
    when 'cash_on_delivery' then 'Prepará el pago en efectivo para el momento de la entrega.'
    else 'Coordinaremos el pago contigo pronto.' end;
  for _it in select value from jsonb_array_elements(coalesce(_o.items,'[]'::jsonb)) loop
    _items := _items || '<li>' || public._html_escape(coalesce(_it->>'name','Ítem')) || ' × ' || coalesce(_it->>'qty','1') || '</li>';
  end loop;
  _html := '<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111827">'
    || '<h2 style="color:#16a34a">¡Orden recibida! ' || public._html_escape(coalesce(_o.order_number,'')) || '</h2>'
    || '<p>Hola ' || public._html_escape(coalesce(_o.customer_name,'Cliente')) || ', hemos recibido tu orden.</p>'
    || '<ul>' || _items || '</ul>'
    || case when _hook is not null then
         '<p style="font-size:18px;font-weight:bold">Total pagado hoy: $'||to_char(_hook,'FM999990.00')||'</p>'
         ||'<p style="font-size:13px;color:#6b7280">Próximo ciclo: $'||to_char(_o.total,'FM999990.00')||' · Suscripción recurrente. Cancela cuando quieras.</p>'
       else '<p style="font-size:18px;font-weight:bold">Total: $'||to_char(_o.total,'FM999990.00')||' '||coalesce(_o.currency,'USD')||'</p>' end
    || '<p style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">' || _instr || '</p>'
    || '<p style="font-size:12px;color:#9ca3af">' || public._html_escape(_name) || '</p></div>';
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)], 'application/json',
    jsonb_build_object('from',_name||' <noreply@raisen.agency>','to',_o.customer_email,
      'subject','Orden recibida · '||coalesce(_o.order_number,''),'html',_html)::text)::http_request);
  if _status between 200 and 299 then update public.tenant_landing_orders set confirmation_email_sent_at=now() where id=_order_id;
  else raise warning '_send_order_confirmation_email non-2xx=% order=%', _status, _order_id; end if;
exception when others then raise warning '_send_order_confirmation_email EXCEPTION % order=%', sqlerrm, _order_id;
end $function$
;

-- Email de aceptación firmada digitalmente (constancia legal Ley 148-2004 PR). Se dispara post-pago (checkout
-- completed) si el pedido tiene offer_id. Datos de la firma desde audit_log (subscription_terms_accepted, 2b1):
-- ip, user_agent, terms_hash, accepted_at. Términos completos embebidos (** → <strong>). Idempotente.
create or replace function public._send_subscription_acceptance_email(_order_id uuid)
returns void language plpgsql security definer set search_path to 'public','vault','extensions' as $function$
declare _o public.tenant_landing_orders%rowtype; _key text; _name text; _off record; _sig jsonb; _sig_ip text; _sig_ua text; _html text; _terms text;
  _pr text; _status int; _resp text;
begin
  select * into _o from public.tenant_landing_orders where id=_order_id;
  if _o.acceptance_email_sent_at is not null or coalesce(_o.customer_email,'')='' or _o.offer_id is null then return; end if;
  select coalesce(nullif(trim(t.display_name),''), t.legal_name, 'NÚCLEO') into _name from public.tenants t where t.id=_o.tenant_id;
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _key is null then return; end if;
  select hook_price, commitment_cycles, terms_es into _off from public.tenant_landing_offers where id=_o.offer_id;
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
end $function$;

-- Enganche en el checkout completed: tras marcar pagado, si hay offer_id manda el email de aceptación.
create or replace function public.process_subscription_checkout(p_tenant_id uuid, p_session jsonb)
returns void language plpgsql security definer set search_path to 'public','vault','extensions' as $function$
declare _oid uuid := nullif(p_session->'metadata'->>'order_id','')::uuid; _has_offer boolean;
begin
  if _oid is not null then
    update public.tenant_landing_orders set status='paid', payment_status='paid', paid_at=now(),
      stripe_checkout_session_id=p_session->>'id', stripe_customer_id=p_session->>'customer' where id=_oid and tenant_id=p_tenant_id;
    perform public._notify_order_created(_oid);
    begin perform public._send_order_confirmation_email(_oid); exception when others then null; end;
    select offer_id is not null into _has_offer from public.tenant_landing_orders where id=_oid;
    if _has_offer then begin perform public._send_subscription_acceptance_email(_oid); exception when others then null; end; end if;
  end if;
  insert into public.notifications(tenant_id, user_id, kind, title, body, entity_type, entity_id)
    select p_tenant_id, ur.user_id, 'payment_received', 'Nueva suscripción (Stripe)',
      'Se activó una suscripción recurrente', 'order', _oid
    from public.user_roles ur where ur.tenant_id=p_tenant_id and ur.role in ('ceo','coo','superadmin');
end $function$;
