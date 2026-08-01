-- MIGR 346 — Bug A (UX/trazabilidad en Stripe Checkout): los 4 flujos one_time (Instalación Soterrados,
-- Hydro-Jet 250°, Pintura de Tapas, Evaluación) mostraban solo "Orden #N · $990" en la columna izquierda,
-- sin el nombre del servicio. Verificado contra sessions reales: #61/#39 → description "Orden #61"/"Orden #39";
-- las suscripciones ya mostraban bien el nombre (usan items->0->>'name').
-- FIX (solo la rama de ORDEN): line_items se construyen dinámicamente desde order.items[] →
--   name = items[i].name (servicio real) · quantity = items[i].qty · unit_amount = items[i].price
--   · description = "Orden #N" (referencia pegada a cada línea).
-- Los add-ons (migr 345) se desglosan como líneas propias en Stripe. Aprovecha la invariante
-- Σ(price×qty)==subtotal garantizada por esa migración.
-- SEGURIDAD: si las líneas no suman exactamente el total (redondeos, datos legacy), se DEGRADA a la línea
-- única con el total correcto + audit_log 'stripe_line_items_mismatch' — nunca se cobra distinto a lo que el
-- cliente vio, y nunca se aborta la venta (abortar = venta perdida por un centavo).
-- NO SE TOCA: la rama de facturas ('Factura #N' cae al fallback = comportamiento idéntico al actual),
-- create_stripe_subscription_checkout (path sano), la firma del RPC, ni el frontend.
CREATE OR REPLACE FUNCTION public.create_stripe_checkout_session(p_invoice_token text DEFAULT NULL::text, p_order_token text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare _tid uuid; _amount numeric; _email text; _label text; _meta_key text; _meta_val text; _domain text;
  _sk text; _name text; _st int; _resp text; _body text;
  _order_num text; _items jsonb; _lines text; _sum bigint; _expected bigint; _tqty int;
begin
  if p_invoice_token is not null then
    select tenant_id, coalesce(balance,total), email, 'Factura '||coalesce(invoice_number,''), id::text
      into _tid, _amount, _email, _label, _meta_val from public.invoices where public_token = p_invoice_token;
    _meta_key := 'invoice_id';
  elsif p_order_token is not null then
    select tenant_id, total, customer_email, 'Orden '||coalesce(order_number,''), id::text, order_number, items
      into _tid, _amount, _email, _label, _meta_val, _order_num, _items from public.tenant_landing_orders where public_token = p_order_token;
    _meta_key := 'order_id';
  end if;
  if _tid is null then return jsonb_build_object('error','not_found'); end if;
  if coalesce(_amount,0) <= 0 then return jsonb_build_object('error','nothing_to_pay'); end if;
  select stripe_secret_vault_name into _name from public.tenant_payment_config where tenant_id=_tid and stripe_enabled;
  if _name is null then return jsonb_build_object('error','stripe_not_enabled'); end if;
  select decrypted_secret into _sk from vault.decrypted_secrets where name=_name limit 1;
  if _sk is null then return jsonb_build_object('error','no_secret'); end if;
  select coalesce(primary_domain, allowed_origins->>0, 'nucleoraisen.com') into _domain from public.tenants where id=_tid;
  _domain := regexp_replace(_domain, '^https?://', '');
  _expected := round(_amount*100)::bigint;
  -- (Bug A) line_items desde order.items[]: nombre real del servicio + qty + precio unitario + "Orden #N" como
  -- descripción. Los add-ons (migr 345) se desglosan como líneas propias. La rama de facturas no entra aquí.
  if _items is null or jsonb_array_length(_items) = 0 then
    _lines := null;
  else
    -- Σqty para repartir el total en órdenes legacy sin `price` en items (backfill 345 solo tocó qty).
    select coalesce(sum(greatest(coalesce(nullif(it->>'qty','')::int,1),1)),1) into _tqty
      from jsonb_array_elements(_items) it;
    select string_agg('&line_items['||(x.i-1)||'][quantity]='||x.q
             ||'&line_items['||(x.i-1)||'][price_data][currency]=usd'
             ||'&line_items['||(x.i-1)||'][price_data][unit_amount]='||x.ua
             ||'&line_items['||(x.i-1)||'][price_data][product_data][name]='||public._urlencode(x.nm)
             ||'&line_items['||(x.i-1)||'][price_data][product_data][description]='||public._urlencode('Orden '||coalesce(_order_num,'')),
             '' order by x.i), sum(x.q*x.ua)
      into _lines, _sum
      from (select i, greatest(coalesce(nullif(it->>'qty','')::int,1),1) as q,
                   round(coalesce(nullif(it->>'price','')::numeric,
                         _amount/greatest(_tqty,1))*100)::bigint as ua,
                   coalesce(nullif(it->>'name',''), 'Servicio') as nm
            from jsonb_array_elements(_items) with ordinality t(it,i)) x;
    -- Coherencia: si las líneas no suman exactamente el total del comprobante, se DEGRADA a línea única con el
    -- total correcto (nunca cobrar distinto a lo que el cliente vio) y se deja rastro. No se aborta la venta.
    if _sum is distinct from _expected then
      insert into public.audit_log(tenant_id,action,entity_type,entity_id,new_values,risk_level)
        values(_tid,'stripe_line_items_mismatch','order',_meta_val::uuid,
          jsonb_build_object('sum_lines',_sum,'expected',_expected,'items',_items),'high');
      _lines := null;
    end if;
  end if;
  if _lines is null then  -- fallback legacy/facturas: 1 línea con el label clásico y el total exacto
    _lines := '&line_items[0][quantity]=1&line_items[0][price_data][currency]=usd'
      ||'&line_items[0][price_data][unit_amount]='||_expected
      ||'&line_items[0][price_data][product_data][name]='||public._urlencode(_label);
  end if;
  _body := 'mode=payment&payment_method_types[0]=card'
    ||_lines
    ||'&success_url='||public._urlencode('https://'||_domain||'/'||(case when _meta_key='invoice_id' then 'factura' else 'orden' end)||'/'||coalesce(p_invoice_token,p_order_token)||'?paid=1')
    ||'&cancel_url='||public._urlencode('https://'||_domain||'/'||(case when _meta_key='invoice_id' then 'factura' else 'orden' end)||'/'||coalesce(p_invoice_token,p_order_token))
    ||'&metadata['||_meta_key||']='||_meta_val||'&metadata[tenant_id]='||_tid::text
    ||case when coalesce(_email,'')<>'' then '&customer_email='||public._urlencode(_email) else '' end;
  begin
    perform http_set_curlopt('CURLOPT_TIMEOUT_MS','9000');
    select status, content into _st, _resp from http(('POST','https://api.stripe.com/v1/checkout/sessions',
      array[http_header('Authorization','Bearer '||_sk)], 'application/x-www-form-urlencoded', _body)::http_request);
  exception when others then return jsonb_build_object('error','stripe_unreachable','detail',sqlerrm); end;
  if _st = 200 then return jsonb_build_object('checkout_url', (_resp::jsonb)->>'url', 'session_id', (_resp::jsonb)->>'id');
  else return jsonb_build_object('error','stripe_rejected','detail', coalesce((_resp::jsonb)->'error'->>'message','HTTP '||_st)); end if;
end $function$
;
