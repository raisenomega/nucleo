-- SIDE-8 (commit 1) · Tres defectos de los correos y comprobantes. Auditoría E2E 2026-08-01.
-- Los tres se vuelven visibles justo cuando v2a.6 encienda el flujo de Hydro-Jet, así que van antes.

-- ---------------------------------------------------------------------------------------------------
-- M1 · La constancia legal miente cuando el contrato NO viene de una oferta.  [riesgo DACO]
--
-- Defecto 1 (el que traía la auditoría): las tres líneas de precio se imprimían siempre, con coalesce.
-- Sin oferta, `_off` viene vacío y el documento afirmaba:
--     «Precio promocional (1er ciclo): $0.00»   ← falso
--     «Compromiso mínimo: 3 ciclos»             ← inventado por el coalesce, nadie lo pactó
--
-- Defecto 2 (encontrado al leer la función, NO estaba en el encargo): la firma tampoco existe.
-- La búsqueda del registro de aceptación es `where entity_id = _o.offer_id`, que con offer_id NULL no
-- casa con nada. Y `_public_create_order` sólo escribe ese registro `if _offer_id is not null`. Así que
-- por el camino del formulario el correo salía con «Firma digital (hash): » VACÍA, mientras el pie
-- seguía afirmando validez legal bajo la Ley 148-2004. Un certificado de firma sin firma es peor
-- mentira que un precio equivocado.
--
-- DECISIÓN: fail-closed. Si no hay registro de aceptación, NO se emite el documento y queda traza. El
-- certificado no puede existir antes que la firma. v2a.6 tendrá que hacer que _public_create_order
-- registre la aceptación también para el camino del formulario; hasta entonces este correo calla en vez
-- de mentir. El camino de OFERTA queda byte-idéntico: sigue imprimiendo sus tres líneas.
create or replace function public._send_subscription_acceptance_email(_order_id uuid)
returns void language plpgsql security definer set search_path to 'public','vault','extensions' as $$
declare _o public.tenant_landing_orders%rowtype; _key text; _name text; _off record; _sig jsonb; _sig_ip text; _sig_ua text;
  _html text; _terms text; _pr text; _status int; _resp text; _precios text;
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
  -- Sin registro de aceptación no hay hash que certificar: se calla y se deja traza, no se emite un
  -- documento que se declare legalmente válido sin firma dentro.
  if _sig is null or coalesce(_sig->>'terms_hash','') = '' then
    insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
      values(_o.tenant_id,'terms_signature_missing','order',_order_id,
             jsonb_build_object('form_id',_o.form_id,'offer_id',_o.offer_id,
               'motivo','sin registro subscription_terms_accepted: no se emite constancia sin firma'),'medium');
    return;
  end if;
  _pr := to_char((coalesce((_sig->>'accepted_at')::timestamptz, now()) at time zone 'America/Puerto_Rico'),'DD/MM/YYYY HH24:MI');
  _terms := regexp_replace(replace(public._html_escape(coalesce(_off.terms_es,'')), E'\n', '<br>'), '\*\*(.*?)\*\*', '<strong>\1</strong>', 'g');
  -- Bloque de precios: con oferta se detallan hook/recurrente/compromiso; sin ella se declara el precio
  -- del servicio y punto — no se inventa una promoción ni un compromiso que nadie pactó.
  _precios := case when _o.offer_id is not null then
      '<li>Precio promocional (1er ciclo): $'||to_char(coalesce(_off.hook_price,0),'FM999990.00')||'</li>'
      || '<li>Precio regular (ciclos 2+): $'||to_char(coalesce(_o.total,0),'FM999990.00')||'</li>'
      || '<li>Compromiso mínimo: '||coalesce(_off.commitment_cycles,3)||' ciclos</li>'
    else '<li>Precio del servicio: $'||to_char(coalesce(_o.total,0),'FM999990.00')||'</li>' end;
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
    || _precios
    || '<li>Firma digital (hash): '||public._html_escape(coalesce(_sig->>'terms_hash',''))||'</li></ul></div>'
    || '<p style="font-size:13px">Yo, '||public._html_escape(coalesce(_o.customer_name,''))||', acepté los siguientes Términos y Condiciones:</p>'
    || '<div style="font-size:11px;color:#374151;border:1px solid #e5e7eb;border-radius:8px;padding:12px;line-height:1.5">'||_terms||'</div>'
    || '<p style="font-size:12px;color:#6b7280">Documento con validez legal bajo la Ley Núm. 148 de 2004 de Firma Digital y Comercio Electrónico de Puerto Rico. San Juan, Puerto Rico · '||_pr||'</p>'
    || '<p style="font-size:12px;color:#9ca3af">'||public._html_escape(_name)||'</p></div>';
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)], 'application/json',
    jsonb_build_object('from',_name||' <noreply@raisen.agency>','to',_o.customer_email,
      'subject','Confirmación de Suscripción y Aceptación de Términos · '||_name,'html',_html)::text)::http_request);
  if _status between 200 and 299 then
    update public.tenant_landing_orders set acceptance_email_sent_at = now() where id=_order_id;
    insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
      values(_o.tenant_id,'acceptance_email_sent','order',_order_id,jsonb_build_object('email',_o.customer_email),'low');
  else
    -- AÑADIDO (no estaba en el original): un no-2xx desaparecía sin rastro. Mismo principio que el resto
    -- del proyecto: audit_log refleja el resultado real, no la intención.
    insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
      values(_o.tenant_id,'acceptance_email_failed','order',_order_id,
             jsonb_build_object('status',_status,'body',left(coalesce(_resp,''),300)),'high');
  end if;
exception when others then raise warning '_send_subscription_acceptance_email EXC % order=%', sqlerrm, _order_id;
end $$;
revoke execute on function public._send_subscription_acceptance_email(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------
-- M2 · El correo al owner ignoraba la oferta.  ·  M3 · «Ver en panel» era un enlace muerto.
--
-- M2: usaba _o.total en asunto, cuerpo y campana. Con oferta activa el cliente paga el hook ($19.98) y
-- el owner leía el recurrente ($69.95). El correo al CLIENTE ya se arregló en la migr 338; el del owner
-- se quedó atrás.
--
-- M3: `'https://app.'||_dom` añadía el prefijo sin mirar si ya estaba, y el primary_domain de Zafacones
-- ES `app.zramos.com` -> construía `https://app.app.zramos.com/orders/<id>`, dominio inexistente. Es la
-- imagen especular del bug que motivó publicLandingHref(), que QUITA ese prefijo. Verificado en los 12
-- tenants: 1 con prefijo `app.`, 1 en localhost, 10 sin dominio configurado.
create or replace function public._notify_order_created(_order_id uuid)
returns void language plpgsql security definer set search_path to 'public','extensions' as $$
declare _o public.tenant_landing_orders%rowtype; _key text; _to text; _uid uuid; _name text; _dom text;
        _url text; _btn text := ''; _html text; _status int; _resp text; _hook numeric; _importe text; _linea text;
begin
  select * into _o from public.tenant_landing_orders where id = _order_id;
  select coalesce(nullif(trim(t.display_name),''), t.legal_name, 'NÚCLEO'), t.primary_domain into _name, _dom
    from public.tenants t where t.id = _o.tenant_id;
  select ur.user_id, pr.email into _uid, _to from public.user_roles ur join public.profiles pr on pr.id=ur.user_id
    where ur.tenant_id=_o.tenant_id and ur.role in ('ceo','superadmin') order by ur.role limit 1;
  if _o.offer_id is not null then select hook_price into _hook from public.tenant_landing_offers where id=_o.offer_id; end if;
  -- Con oferta se dice lo que se cobra HOY y lo que vendrá después; sin ella, el total de siempre.
  _importe := case when _hook is not null
    then '$'||to_char(_hook,'FM999999990.00')||' hoy · $'||to_char(_o.total,'FM999999990.00')||' ciclos 2+'
    else '$'||to_char(_o.total,'FM999999990.00') end;
  _linea := case when _hook is not null
    then '<tr><td style="padding:8px 0;font-size:18px;font-weight:bold">$'||to_char(_hook,'FM999999990.00')||' '||coalesce(_o.currency,'USD')||' <span style="font-size:13px;font-weight:normal;color:#6b7280">cobrado hoy</span></td></tr>'
         ||'<tr><td style="padding:0 0 8px;font-size:13px;color:#6b7280">Ciclos 2+: $'||to_char(_o.total,'FM999999990.00')||' · suscripción recurrente</td></tr>'
    else '<tr><td style="padding:8px 0;font-size:18px;font-weight:bold">$'||to_char(_o.total,'FM999999990.00')||' '||coalesce(_o.currency,'USD')||'</td></tr>' end;
  insert into public.notifications (tenant_id, user_id, kind, title, body, entity_type, entity_id)
    values (_o.tenant_id, _uid, 'order_new', 'Nueva orden web '||coalesce(_o.order_number,''),
            coalesce(_o.customer_name,'Cliente')||' · '||_importe, 'order', _o.id);
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _to is null or _key is null then raise warning '_notify_order_created falta email/key order=%', _order_id; return; end if;
  -- El prefijo `app.` sólo se añade si NO está ya. localhost va al puerto de desarrollo.
  _url := case
    when _dom is null then null
    when _dom = 'localhost' then 'http://localhost:5173/orders/'||_order_id
    when _dom like 'app.%' then 'https://'||_dom||'/orders/'||_order_id
    else 'https://app.'||_dom||'/orders/'||_order_id end;
  if _url is not null then
    _btn := '<tr><td style="padding:14px 0"><a href="'||_url||'" style="background:#111827;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:bold;display:inline-block">Ver en panel</a></td></tr>'; end if;
  _html := '<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111827">'
    || '<h2 style="font-size:18px">Nueva orden web '||public._html_escape(coalesce(_o.order_number,''))||'</h2>'
    || '<table role="presentation" width="100%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px"><tr><td style="padding:16px"><table width="100%">'
    || '<tr><td style="padding:4px 0;font-size:15px"><strong>'||public._html_escape(coalesce(_o.customer_name,'Cliente'))||'</strong></td></tr>'
    || '<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">'||public._html_escape(coalesce(_o.customer_email,''))||' · '||public._html_escape(coalesce(_o.customer_phone,''))||'</td></tr>'
    || _linea || _btn || '</table></td></tr></table>'
    || '<p style="font-size:12px;color:#9ca3af;margin-top:16px">'||public._html_escape(_name)||'</p></div>';
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)], 'application/json',
    jsonb_build_object('from',_name||' <noreply@raisen.agency>','to',_to,
      'subject','Nueva orden web · '||coalesce(_o.order_number,'')||' · '||_importe,'html',_html)::text)::http_request);
  if _status is null or _status<200 or _status>=300 then raise warning '_notify_order_created Resend no-2xx=% order=%', _status, _order_id; end if;
exception when others then raise warning '_notify_order_created EXCEPTION % order=%', sqlerrm, _order_id;
end $$;
revoke execute on function public._notify_order_created(uuid) from public, anon, authenticated;

insert into public.audit_log (tenant_id, action, entity_type, new_values, risk_level)
values (null, 'side8_email_fixes', 'security',
  jsonb_build_object(
    'M1', 'constancia legal: sin oferta ya no inventa precio promocional ni compromiso; y si no hay firma registrada NO se emite',
    'M2', 'correo al owner offer-aware (hook cobrado hoy + recurrente), igual que el del cliente desde la migr 338',
    'M3', 'enlace Ver en panel: el prefijo app. ya no se duplica; localhost va al puerto de desarrollo',
    'migration', '20260808000360'),
  'medium');
