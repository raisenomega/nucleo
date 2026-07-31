-- OFERTAS-HOOK-STRIPE 2b2 (final del arco): coupon-once + reversión + email de aceptación (MONEY-CRITICAL).
-- 1) create_stripe_subscription_checkout: si el pedido trae offer_id → crea un Stripe coupon amount_off=(recurrente
--    − hook), duration=once, y lo pasa en discounts[] a la sesión → 1ra factura = hook, luego recurrente. + metadata.
-- 2) process_subscription_event: en subscription.deleted, si cycles_paid < commitment y no se aplicó → cobra la
--    reversión (recurring − hook) vía invoice_item + invoice auto-pay (Cálculo A). Idempotente por reversal_applied.
-- 3) _send_subscription_acceptance_email + hook en checkout completed: constancia legal firmada (Ley 148-2004 PR).
alter table public.tenant_landing_orders add column if not exists reversal_applied boolean not null default false;
alter table public.tenant_landing_orders add column if not exists acceptance_email_sent_at timestamptz;

CREATE OR REPLACE FUNCTION public.create_stripe_subscription_checkout(p_order_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare _tid uuid; _oid text; _amount numeric; _email text; _label text; _freq text; _domain text;
  _sk text; _name text; _ival text; _icount int; _st int; _resp text; _body text;
  _offer_id uuid; _hook numeric; _commit int; _amt_off bigint; _coupon_id text; _cresp text; _cst int; _disc text := ''; _meta text := '';
begin
  select tenant_id, id::text, total, customer_email, coalesce(items->0->>'name','Suscripción'), billing_frequency, offer_id
    into _tid, _oid, _amount, _email, _label, _freq, _offer_id
    from public.tenant_landing_orders where public_token=p_order_token and order_type='subscription';
  if _tid is null then return jsonb_build_object('error','not_found'); end if;
  if coalesce(_amount,0) <= 0 then return jsonb_build_object('error','nothing_to_pay'); end if;
  select stripe_secret_vault_name into _name from public.tenant_payment_config where tenant_id=_tid and stripe_enabled;
  if _name is null then return jsonb_build_object('error','stripe_not_enabled'); end if;
  select decrypted_secret into _sk from vault.decrypted_secrets where name=_name limit 1;
  if _sk is null then return jsonb_build_object('error','no_secret'); end if;
  if _freq ~ '^\d+w$' then _ival:='week'; _icount:=left(_freq,length(_freq)-1)::int;
  elsif _freq ~ '^\d+m$' then _ival:='month'; _icount:=left(_freq,length(_freq)-1)::int;
  else _ival:='month'; _icount:=1; end if;
  if _offer_id is not null then  -- OFERTA: coupon duration=once → 1ra factura = hook, luego recurrente
    select hook_price, commitment_cycles into _hook, _commit from public.tenant_landing_offers
      where id=_offer_id and tenant_id=_tid and is_active
        and (valid_from is null or valid_from<=now()) and (valid_until is null or valid_until>=now())
        and applicable_services ? (select items->0->>'id' from public.tenant_landing_orders where public_token=p_order_token);
    _amt_off := round((_amount - coalesce(_hook,_amount))*100)::bigint;
    if _hook is not null and _amt_off > 0 then
      begin
        perform http_set_curlopt('CURLOPT_TIMEOUT_MS','9000');
        select status, content into _cst, _cresp from http(('POST','https://api.stripe.com/v1/coupons',
          array[http_header('Authorization','Bearer '||_sk)],'application/x-www-form-urlencoded',
          'amount_off='||_amt_off||'&currency=usd&duration=once&name='||public._urlencode('Oferta Bienvenida Ciclo 1'))::http_request);
      exception when others then return jsonb_build_object('error','stripe_coupon_failed','detail',sqlerrm); end;
      if _cst<>200 then return jsonb_build_object('error','stripe_coupon_rejected','detail',coalesce((_cresp::jsonb)->'error'->>'message','HTTP '||_cst)); end if;
      _coupon_id := (_cresp::jsonb)->>'id';
      _disc := '&discounts[0][coupon]='||_coupon_id;
      _meta := '&subscription_data[metadata][offer_id]='||_offer_id::text
        ||'&subscription_data[metadata][commitment_cycles]='||coalesce(_commit,3)
        ||'&subscription_data[metadata][first_cycle_price]='||coalesce(_hook,0)
        ||'&subscription_data[metadata][recurring_price]='||_amount||'&subscription_data[metadata][coupon_id]='||_coupon_id;
    end if;
  end if;
  select coalesce(primary_domain, allowed_origins->>0, 'nucleoraisen.com') into _domain from public.tenants where id=_tid;
  _domain := regexp_replace(_domain,'^https?://','');
  _body := 'mode=subscription&line_items[0][quantity]=1&line_items[0][price_data][currency]=usd'
    ||'&line_items[0][price_data][unit_amount]='||round(_amount*100)::bigint
    ||'&line_items[0][price_data][product_data][name]='||public._urlencode(_label)
    ||'&line_items[0][price_data][recurring][interval]='||_ival
    ||'&line_items[0][price_data][recurring][interval_count]='||_icount
    ||'&metadata[order_id]='||_oid||'&metadata[tenant_id]='||_tid::text
    ||'&subscription_data[metadata][order_id]='||_oid||'&subscription_data[metadata][tenant_id]='||_tid::text
    ||_disc||_meta
    ||'&success_url='||public._urlencode('https://'||_domain||'/orden/'||p_order_token||'?subscribed=1')
    ||'&cancel_url='||public._urlencode('https://'||_domain||'/')
    ||case when coalesce(_email,'')<>'' then '&customer_email='||public._urlencode(_email) else '' end;
  begin
    perform http_set_curlopt('CURLOPT_TIMEOUT_MS','9000');
    select status, content into _st, _resp from http(('POST','https://api.stripe.com/v1/checkout/sessions',
      array[http_header('Authorization','Bearer '||_sk)],'application/x-www-form-urlencoded',_body)::http_request);
  exception when others then return jsonb_build_object('error','stripe_unreachable','detail',sqlerrm); end;
  if _st=200 then return jsonb_build_object('checkout_url',(_resp::jsonb)->>'url','session_id',(_resp::jsonb)->>'id');
  else return jsonb_build_object('error','stripe_rejected','detail',coalesce((_resp::jsonb)->'error'->>'message','HTTP '||_st)); end if;
end $function$
;

-- Reversión del descuento (Cálculo A): en customer.subscription.deleted, si cycles_paid < commitment se cobra
-- (recurring − hook) = el descuento del único ciclo con hook. invoice_item + invoice auto-pay. Idempotente por
-- reversal_applied. Preserva el upsert de la suscripción. Necesita el secret del Vault (search_path lo incluye).
create or replace function public.process_subscription_event(p_tenant_id uuid, p_sub jsonb)
returns void language plpgsql security definer set search_path to 'public','vault','extensions' as $function$
declare _oid uuid := nullif(p_sub->'metadata'->>'order_id','')::uuid; _o record;
        _commit int := coalesce(nullif(p_sub->'metadata'->>'commitment_cycles','')::int, 3);
        _hook numeric := coalesce(nullif(p_sub->'metadata'->>'first_cycle_price','')::numeric, 0);
        _recur numeric := coalesce(nullif(p_sub->'metadata'->>'recurring_price','')::numeric, 0);
        _rev bigint; _sk text; _name text; _cust text := p_sub->>'customer'; _st int; _resp text;
begin
  select customer_name, customer_email, customer_phone, billing_frequency, total,
    items->0->>'kind' as ik, nullif(items->0->>'id','')::uuid as iid, items->0->>'name' as inm, custom_fields,
    coalesce(cycles_paid,0) as paid, coalesce(reversal_applied,false) as rev_done
    into _o from public.tenant_landing_orders where id=_oid;
  insert into public.stripe_subscriptions(tenant_id, order_id, stripe_subscription_id, stripe_customer_id, item_kind, item_id, item_name,
    customer_email, customer_name, customer_phone, frequency, amount, status,
    current_period_start, current_period_end, cancel_at_period_end, canceled_at, form_data, metadata)
  values(p_tenant_id, _oid, p_sub->>'id', _cust, _o.ik, _o.iid, _o.inm,
    _o.customer_email, _o.customer_name, _o.customer_phone, _o.billing_frequency, coalesce(_o.total,0),
    coalesce(p_sub->>'status','active'),
    to_timestamp(nullif(p_sub->>'current_period_start','')::bigint), to_timestamp(nullif(p_sub->>'current_period_end','')::bigint),
    coalesce((p_sub->>'cancel_at_period_end')::boolean,false), to_timestamp(nullif(p_sub->>'canceled_at','')::bigint),
    _o.custom_fields, coalesce(p_sub->'metadata','{}'::jsonb))
  on conflict (stripe_subscription_id) do update set status=excluded.status,
    current_period_start=excluded.current_period_start, current_period_end=excluded.current_period_end,
    cancel_at_period_end=excluded.cancel_at_period_end, canceled_at=excluded.canceled_at, updated_at=now();
  -- REVERSIÓN: solo en cancelación, con oferta, compromiso incompleto, y no aplicada aún.
  if p_sub->>'status' = 'canceled' and _oid is not null and not _o.rev_done
     and _hook > 0 and _o.paid < _commit and (_recur - _hook) > 0 then
    _rev := round((_recur - _hook)*100)::bigint;
    select stripe_secret_vault_name into _name from public.tenant_payment_config where tenant_id=p_tenant_id and stripe_enabled;
    select decrypted_secret into _sk from vault.decrypted_secrets where name=_name limit 1;
    if _sk is not null then
      begin
        perform http_set_curlopt('CURLOPT_TIMEOUT_MS','9000');
        perform http(('POST','https://api.stripe.com/v1/invoiceitems',array[http_header('Authorization','Bearer '||_sk)],
          'application/x-www-form-urlencoded','customer='||_cust||'&amount='||_rev||'&currency=usd&description='||
          public._urlencode('Reversion del descuento promocional por cancelacion anticipada. Compromiso de '||_commit||' ciclos no completado ('||_o.paid||' de '||_commit||').'))::http_request);
        select status, content into _st, _resp from http(('POST','https://api.stripe.com/v1/invoices',
          array[http_header('Authorization','Bearer '||_sk)],'application/x-www-form-urlencoded',
          'customer='||_cust||'&auto_advance=true&collection_method=charge_automatically')::http_request);
      exception when others then
        insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
          values(p_tenant_id,'subscription_reversal_failed','order',_oid,jsonb_build_object('error',sqlerrm,'amount',_rev),'high');
        return;
      end;
      update public.tenant_landing_orders set reversal_applied=true where id=_oid;
      insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
        values(p_tenant_id,'subscription_reversal_applied','order',_oid,
          jsonb_build_object('amount',_rev,'cycles_paid',_o.paid,'commitment',_commit,'invoice_status',_st),'medium');
    end if;
  end if;
end $function$;

-- Email de aceptación firmada digitalmente (constancia legal Ley 148-2004 PR). Se dispara post-pago (checkout
-- completed) si el pedido tiene offer_id. Datos de la firma desde audit_log (subscription_terms_accepted, 2b1):
-- ip, user_agent, terms_hash, accepted_at. Términos completos embebidos (** → <strong>). Idempotente.
create or replace function public._send_subscription_acceptance_email(_order_id uuid)
returns void language plpgsql security definer set search_path to 'public','vault','extensions' as $function$
declare _o public.tenant_landing_orders%rowtype; _key text; _name text; _off record; _sig jsonb; _html text; _terms text;
  _pr text; _status int; _resp text;
begin
  select * into _o from public.tenant_landing_orders where id=_order_id;
  if _o.acceptance_email_sent_at is not null or coalesce(_o.customer_email,'')='' or _o.offer_id is null then return; end if;
  select coalesce(nullif(trim(t.display_name),''), t.legal_name, 'NÚCLEO') into _name from public.tenants t where t.id=_o.tenant_id;
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _key is null then return; end if;
  select hook_price, commitment_cycles, terms_es into _off from public.tenant_landing_offers where id=_o.offer_id;
  select new_values into _sig from public.audit_log where action='subscription_terms_accepted' and entity_id=_o.offer_id
    and new_values->>'order_id'=_order_id::text order by created_at desc limit 1;
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
    || '<li>Dirección IP: '||public._html_escape(coalesce(_sig->>'ip_address', _o.source_ip, ''))||'</li>'
    || '<li>Dispositivo: '||public._html_escape(coalesce(_sig->>'user_agent', _o.user_agent, ''))||'</li>'
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
