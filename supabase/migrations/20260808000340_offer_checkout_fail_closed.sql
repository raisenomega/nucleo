-- AUDIT-URGENTE-OFERTA-COUPON: fail-closed en el checkout de suscripción con oferta (MONEY-SAFE).
-- Hallazgo: si el pedido trae offer_id pero la oferta ya no aplica (valid_from futuro / vencida / inactiva /
-- servicio no incluido), el checkout la rechazaba EN SILENCIO y cobraba el precio recurrente completo — el
-- cliente veía $19.98 en el modal, aceptaba los términos, y Stripe le cobraba $39.99/$69.95 (fail-OPEN).
-- Fix: abortar con 'offer_not_applicable' + audit_log en vez de cobrar de más. El frontend ya muestra error
-- de pago cuando el checkout no devuelve URL (OrderModal → toast), así que no requiere cambio de UI.
-- (La causa del incidente fue de DATOS: oferta con valid_from=2026-08-03 estando a 31/07. El código del
--  coupon estaba intacto — diff byte-idéntico contra migr 337.)
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
    if _hook is null then  -- FAIL-CLOSED: el pedido invoca una oferta que ya no aplica (vencida/inactiva/servicio
      -- no incluido). NO cobrar el precio completo en silencio: el cliente aceptó $hook, no el recurrente.
      insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
        values(_tid,'offer_not_applicable_at_checkout','order',_oid::uuid,
          jsonb_build_object('offer_id',_offer_id,'amount',_amount),'medium');
      return jsonb_build_object('error','offer_not_applicable');
    end if;
    _amt_off := round((_amount - _hook)*100)::bigint;
    if _amt_off > 0 then
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
