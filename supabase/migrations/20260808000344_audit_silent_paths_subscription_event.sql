-- MIGR 344 — Trazabilidad: loggear los 2 paths silenciosos de customer.subscription.deleted.
-- Cierra la deuda del arco OFERTAS-HOOK-STRIPE (Lección #1 del runbook: "audit_log DEBE reflejar el resultado
-- real, no la intención"). La Edge Function stripe-webhook es un router delgado y NO se toca: la lógica vive
-- en este RPC. Firma sin cambios. Base = definición ACTUAL de prod (lección #9: no regenerar desde source viejo).
-- PATH 1 (deuda del Escenario 4): cuando el cliente CUMPLIÓ el compromiso (cycles_paid >= commitment) el `if`
--   compuesto de la reversión fallaba y la función salía sin registrar la decisión de NO cobrar. Se agrega un
--   `elsif` ACOTADO (no `else`) para no generar ruido en cada subscription.created/updated.
-- PATH 2 (descubierto en la auditoría, más crítico): si el Vault no devuelve el secret, la reversión DEBIDA no
--   ocurre y no quedaba rastro alguno → ahora registra subscription_reversal_failed reason='no_stripe_secret'.
-- risk_level: 'low' (compliance) y 'high' (fallo de cobro). El CHECK solo acepta low|medium|high|critical.
CREATE OR REPLACE FUNCTION public.process_subscription_event(p_tenant_id uuid, p_sub jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare _oid uuid := nullif(p_sub->'metadata'->>'order_id','')::uuid; _o record;
        _commit int := coalesce(nullif(p_sub->'metadata'->>'commitment_cycles','')::int, 3);
        _hook numeric := coalesce(nullif(p_sub->'metadata'->>'first_cycle_price','')::numeric, 0);
        _recur numeric := coalesce(nullif(p_sub->'metadata'->>'recurring_price','')::numeric, 0);
        _rev bigint; _inv text; _pm text; _paid numeric := 0; _sk text; _name text; _cust text := p_sub->>'customer'; _st int; _resp text;
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
        perform http_set_curlopt('CURLOPT_TIMEOUT_MS','8000');
        -- (1) invoice DRAFT primero. NO se confía en que absorba pending invoice items: en la API moderna
        -- de Stripe una invoice nueva NO los incluye → salía en $0.00 con el item huérfano.
        select status, content into _st, _resp from http(('POST','https://api.stripe.com/v1/invoices',
          array[http_header('Authorization','Bearer '||_sk)],'application/x-www-form-urlencoded',
          'customer='||_cust||'&collection_method=charge_automatically&auto_advance=false')::http_request);
        if _st <> 200 then raise exception 'invoice_create http % %', _st, left(_resp,300); end if;
        _inv := (_resp::jsonb)->>'id';
        -- (2) el item se ADJUNTA explícitamente a esa invoice (determinista) y se verifica el status.
        select status, content into _st, _resp from http(('POST','https://api.stripe.com/v1/invoiceitems',
          array[http_header('Authorization','Bearer '||_sk)],'application/x-www-form-urlencoded',
          'customer='||_cust||'&invoice='||_inv||'&amount='||_rev||'&currency=usd&description='||
          public._urlencode('Reversion del descuento promocional por cancelacion anticipada. Compromiso de '||_commit||' ciclos no completado ('||_o.paid||' de '||_commit||').'))::http_request);
        if _st <> 200 then raise exception 'invoiceitem http % %', _st, left(_resp,300); end if;
        -- (3) finalizar y (4) cobrar.
        select status, content into _st, _resp from http(('POST','https://api.stripe.com/v1/invoices/'||_inv||'/finalize',
          array[http_header('Authorization','Bearer '||_sk)],'application/x-www-form-urlencoded','auto_advance=true')::http_request);
        if _st <> 200 then raise exception 'finalize http % %', _st, left(_resp,300); end if;
        -- El PM del checkout queda attached al customer pero NO como default de invoices → una invoice
        -- standalone da 402 si no se le pasa explícitamente. Se resuelve la tarjeta del customer y se usa.
        select (x.content::jsonb->'data'->0->>'id') into _pm from http(('GET',
          'https://api.stripe.com/v1/payment_methods?customer='||_cust||'&type=card&limit=1',
          array[http_header('Authorization','Bearer '||_sk)],NULL,NULL)::http_request) x;
        select status, content into _st, _resp from http(('POST','https://api.stripe.com/v1/invoices/'||_inv||'/pay',
          array[http_header('Authorization','Bearer '||_sk)],'application/x-www-form-urlencoded',
          case when _pm is not null then 'payment_method='||_pm else '' end)::http_request);
        _paid := coalesce(((_resp::jsonb)->>'amount_paid')::numeric,0)/100.0;
      exception when others then
        insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
          values(p_tenant_id,'subscription_reversal_failed','order',_oid,
            jsonb_build_object('error',sqlerrm,'amount',_rev,'invoice',_inv),'high');
        return;
      end;
      -- (5) el audit refleja el RESULTADO REAL del cobro, no la intención: solo se marca aplicada si cobró.
      if _paid > 0 then
        update public.tenant_landing_orders set reversal_applied=true where id=_oid;
        insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
          values(p_tenant_id,'subscription_reversal_applied','order',_oid,
            jsonb_build_object('amount',_rev,'amount_paid',_paid,'invoice',_inv,'cycles_paid',_o.paid,'commitment',_commit),'medium');
      else
        insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
          values(p_tenant_id,'subscription_reversal_failed','order',_oid,
            jsonb_build_object('reason','invoice_not_paid','amount',_rev,'invoice',_inv,'invoice_status',_st),'high');
      end if;
      else  -- PATH SILENCIOSO 2: sin secret en Vault la reversión DEBIDA no ocurre y antes no dejaba rastro.
        insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
          values(p_tenant_id,'subscription_reversal_failed','order',_oid,
            jsonb_build_object('reason','no_stripe_secret','amount',_rev,
              'cycles_paid',_o.paid,'commitment',_commit,'subscription',p_sub->>'id'),'high');
    end if;
  -- PATH SILENCIOSO 1: el cliente cumplió el compromiso → NO se reversa (correcto), pero antes salía sin
  -- registrar la decisión. `elsif` acotado (no `else`) para no loguear en cada subscription.created/updated.
  elsif p_sub->>'status' = 'canceled' and _oid is not null and not _o.rev_done
        and _hook > 0 and _o.paid >= _commit then
    insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
      values(p_tenant_id,'subscription_cancelled_after_commitment','order',_oid,
        jsonb_build_object('reason','commitment_fulfilled','cycles_paid',_o.paid,'commitment',_commit,
          'subscription',p_sub->>'id','hook_price',_hook,'recurring_price',_recur),'low');
  end if;
end $function$
;
