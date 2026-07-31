-- CYCLES-PAID-COUNTER-FIX (MONEY-CRITICAL): cycles_paid nunca se incrementaba.
-- CAUSA: la API de Stripe 2025 ("Basil") quitó `subscription` del objeto invoice top-level; ahora vive en
-- `invoice.parent.subscription_details.subscription`. process_recurring_payment / process_failed_recurring_payment
-- hacían `_sub := nullif(p_invoice->>'subscription','')` y `if _sub is null then return; end if` → RETORNABAN
-- SILENCIOSAMENTE en TODOS los cobros (0/12 subs con cycles_paid>0, 0 pagos de invoice, 0 errores registrados).
-- El webhook SÍ estaba registrado (invoice.payment_succeeded ✓) y el evento SÍ se entregó (pending_webhooks=0).
-- IMPACTO: la reversión condiciona `cycles_paid < commitment` → con el contador clavado en 0, el Escenario 4
-- (cliente que completó los 3 ciclos) recibiría una reversión INDEBIDA (riesgo DACO).
-- FIX: resolver la subscription con fallback (top-level → parent.subscription_details → lines[0]) = compat con
-- API vieja y nueva. + backfill de cycles_paid=1 en las suscripciones ya cobradas (verificado contra Stripe:
-- 6 subs, 1 invoice pagada cada una).
CREATE OR REPLACE FUNCTION public.process_recurring_payment(p_tenant_id uuid, p_invoice jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare _sub text := coalesce(nullif(p_invoice->>'subscription',''),nullif(p_invoice->'parent'->'subscription_details'->>'subscription',''),nullif(p_invoice->'lines'->'data'->0->'parent'->'subscription_item_details'->>'subscription','')); _intent text := coalesce(nullif(p_invoice->>'payment_intent',''), p_invoice->>'id');
  _amount numeric := coalesce((p_invoice->>'amount_paid')::numeric,0)/100.0; _oid uuid;
begin
  if _sub is null then return; end if;
  select order_id into _oid from public.stripe_subscriptions where stripe_subscription_id=_sub and tenant_id=p_tenant_id;
  insert into public.stripe_payments(tenant_id, stripe_payment_intent_id, landing_order_id, amount, currency, status, payment_method_type, metadata)
    values(p_tenant_id, _intent, _oid, _amount, coalesce(p_invoice->>'currency','usd'),'succeeded','card',
      jsonb_build_object('subscription',_sub,'invoice',p_invoice->>'id'))
  on conflict (stripe_payment_intent_id) do nothing;
  update public.tenant_landing_orders set cycles_paid=coalesce(cycles_paid,0)+1, last_cycle_paid_at=now() where id=_oid;
  if coalesce(p_invoice->>'billing_reason','') <> 'subscription_create' then
    insert into public.notifications(tenant_id,user_id,kind,title,body,entity_type,entity_id)
      select p_tenant_id, ur.user_id,'payment_received','Cobro recurrente',
        '$'||to_char(_amount,'FM999999990.00')||' cobrado (suscripción)','order',_oid
      from public.user_roles ur where ur.tenant_id=p_tenant_id and ur.role in ('ceo','coo','superadmin');
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.process_failed_recurring_payment(p_tenant_id uuid, p_invoice jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare _sub text := coalesce(nullif(p_invoice->>'subscription',''),nullif(p_invoice->'parent'->'subscription_details'->>'subscription',''),nullif(p_invoice->'lines'->'data'->0->'parent'->'subscription_item_details'->>'subscription','')); _oid uuid;
begin
  if _sub is null then return; end if;
  update public.stripe_subscriptions set status='past_due', updated_at=now() where stripe_subscription_id=_sub and tenant_id=p_tenant_id
    returning order_id into _oid;
  insert into public.notifications(tenant_id,user_id,kind,title,body,entity_type,entity_id)
    select p_tenant_id, ur.user_id,'payment_failed','Pago recurrente FALLÓ',
      'Un cliente falló el pago de su suscripción — requiere atención','order',_oid
    from public.user_roles ur where ur.tenant_id=p_tenant_id and ur.role in ('ceo','coo','superadmin');
end $function$
;

-- Backfill: pedidos de suscripción ya pagados cuyo contador quedó en 0 por el bug (ciclo inicial cobrado).
update public.tenant_landing_orders o set cycles_paid = 1, last_cycle_paid_at = coalesce(o.last_cycle_paid_at, o.paid_at)
from public.stripe_subscriptions s
where s.order_id = o.id and coalesce(o.cycles_paid,0) = 0 and o.payment_status = 'paid';
