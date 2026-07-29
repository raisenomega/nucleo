-- LANDING-CLEANUP Fase 2: suscripciones recurrentes con Stripe en el landing público.
-- El precio es DINÁMICO (matriz matrix_1d frecuencia×bins) → NO se pre-crean Prices; se usa
-- price_data recurrente INLINE (mismo patrón que el one-time de Fase 1). La frecuencia real del
-- form es basada en semanas ('2w','4w','6w') → interval=week, interval_count=N.
-- Diseño consistente con Fase 1: la orden (order_type='subscription', creada por _public_create_order)
-- es el registro base; el checkout de suscripción toma p_order_token.

create table if not exists public.stripe_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  order_id uuid references public.tenant_landing_orders(id),
  stripe_subscription_id text unique not null,
  stripe_customer_id text,
  item_kind text, item_id uuid, item_name text,       -- polimórfico (service/product/package)
  customer_email text, customer_name text, customer_phone text,
  frequency text, amount numeric not null default 0, currency text default 'usd',
  status text not null,                                -- estado de Stripe (active/past_due/canceled/…)
  current_period_start timestamptz, current_period_end timestamptz,
  cancel_at_period_end boolean default false, canceled_at timestamptz,
  form_data jsonb, metadata jsonb default '{}',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists idx_stripe_subs_tenant on public.stripe_subscriptions(tenant_id, status);
create index if not exists idx_stripe_subs_customer on public.stripe_subscriptions(stripe_customer_id);
create trigger trg_stripe_subs_updated before update on public.stripe_subscriptions for each row execute function set_updated_at();
alter table public.stripe_subscriptions enable row level security;
create policy subs_tenant on public.stripe_subscriptions for select using (tenant_id = current_tenant());
create policy subs_write_ceo on public.stripe_subscriptions for all using (is_ceo_or_above() and tenant_id = current_tenant());

-- (1) Checkout de suscripción (anon): toma la orden ya creada y arma un Checkout mode=subscription
-- con price_data recurrente inline. El monto es el total per-cycle de la orden (server-autoritativo).
create or replace function public.create_stripe_subscription_checkout(p_order_token text)
 returns jsonb language plpgsql security definer set search_path to 'public','vault','extensions'
as $function$
declare _tid uuid; _oid text; _amount numeric; _email text; _label text; _freq text; _domain text;
  _sk text; _name text; _ival text; _icount int; _st int; _resp text; _body text;
begin
  select tenant_id, id::text, total, customer_email, coalesce(items->0->>'name','Suscripción'), billing_frequency
    into _tid, _oid, _amount, _email, _label, _freq
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
  select coalesce(primary_domain, allowed_origins->>0, 'nucleoraisen.com') into _domain from public.tenants where id=_tid;
  _domain := regexp_replace(_domain,'^https?://','');
  _body := 'mode=subscription&line_items[0][quantity]=1&line_items[0][price_data][currency]=usd'
    ||'&line_items[0][price_data][unit_amount]='||round(_amount*100)::bigint
    ||'&line_items[0][price_data][product_data][name]='||public._urlencode(_label)
    ||'&line_items[0][price_data][recurring][interval]='||_ival
    ||'&line_items[0][price_data][recurring][interval_count]='||_icount
    ||'&metadata[order_id]='||_oid||'&metadata[tenant_id]='||_tid::text
    ||'&subscription_data[metadata][order_id]='||_oid||'&subscription_data[metadata][tenant_id]='||_tid::text
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
end $function$;

-- (2) checkout.session.completed (mode=subscription): marca la orden pagada + notifica "nueva suscripción".
-- El row de stripe_subscriptions lo crea customer.subscription.created (tiene los períodos).
create or replace function public.process_subscription_checkout(p_tenant_id uuid, p_session jsonb)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _oid uuid := nullif(p_session->'metadata'->>'order_id','')::uuid;
begin
  if _oid is not null then
    update public.tenant_landing_orders set status='paid', payment_status='paid', paid_at=now(),
      stripe_checkout_session_id=p_session->>'id', stripe_customer_id=p_session->>'customer' where id=_oid and tenant_id=p_tenant_id;
    perform public._notify_order_created(_oid);
    begin perform public._send_order_confirmation_email(_oid); exception when others then null; end;
  end if;
  insert into public.notifications(tenant_id, user_id, kind, title, body, entity_type, entity_id)
    select p_tenant_id, ur.user_id, 'payment_received', 'Nueva suscripción (Stripe)',
      'Se activó una suscripción recurrente', 'order', _oid
    from public.user_roles ur where ur.tenant_id=p_tenant_id and ur.role in ('ceo','coo','superadmin');
end $function$;

-- (3) customer.subscription.created/updated/deleted → upsert del estado (self-linking por metadata.order_id).
create or replace function public.process_subscription_event(p_tenant_id uuid, p_sub jsonb)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _oid uuid := nullif(p_sub->'metadata'->>'order_id','')::uuid; _o record;
begin
  select customer_name, customer_email, customer_phone, billing_frequency, total,
    items->0->>'kind' as ik, nullif(items->0->>'id','')::uuid as iid, items->0->>'name' as inm, custom_fields
    into _o from public.tenant_landing_orders where id=_oid;
  insert into public.stripe_subscriptions(tenant_id, order_id, stripe_subscription_id, stripe_customer_id, item_kind, item_id, item_name,
    customer_email, customer_name, customer_phone, frequency, amount, status,
    current_period_start, current_period_end, cancel_at_period_end, canceled_at, form_data, metadata)
  values(p_tenant_id, _oid, p_sub->>'id', p_sub->>'customer', _o.ik, _o.iid, _o.inm,
    _o.customer_email, _o.customer_name, _o.customer_phone, _o.billing_frequency, coalesce(_o.total,0),
    coalesce(p_sub->>'status','active'),
    to_timestamp(nullif(p_sub->>'current_period_start','')::bigint), to_timestamp(nullif(p_sub->>'current_period_end','')::bigint),
    coalesce((p_sub->>'cancel_at_period_end')::boolean,false), to_timestamp(nullif(p_sub->>'canceled_at','')::bigint),
    _o.custom_fields, coalesce(p_sub->'metadata','{}'::jsonb))
  on conflict (stripe_subscription_id) do update set status=excluded.status,
    current_period_start=excluded.current_period_start, current_period_end=excluded.current_period_end,
    cancel_at_period_end=excluded.cancel_at_period_end, canceled_at=excluded.canceled_at, updated_at=now();
end $function$;

-- (4) invoice.payment_succeeded: registra el cobro del ciclo (idempotente) + bump cycles + notif (solo renovaciones).
create or replace function public.process_recurring_payment(p_tenant_id uuid, p_invoice jsonb)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _sub text := nullif(p_invoice->>'subscription',''); _intent text := coalesce(nullif(p_invoice->>'payment_intent',''), p_invoice->>'id');
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
end $function$;

-- (5) invoice.payment_failed: marca past_due + notifica al CEO (urgente).
create or replace function public.process_failed_recurring_payment(p_tenant_id uuid, p_invoice jsonb)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _sub text := nullif(p_invoice->>'subscription',''); _oid uuid;
begin
  if _sub is null then return; end if;
  update public.stripe_subscriptions set status='past_due', updated_at=now() where stripe_subscription_id=_sub and tenant_id=p_tenant_id
    returning order_id into _oid;
  insert into public.notifications(tenant_id,user_id,kind,title,body,entity_type,entity_id)
    select p_tenant_id, ur.user_id,'payment_failed','Pago recurrente FALLÓ',
      'Un cliente falló el pago de su suscripción — requiere atención','order',_oid
    from public.user_roles ur where ur.tenant_id=p_tenant_id and ur.role in ('ceo','coo','superadmin');
end $function$;

-- (6) Lista de suscripciones (staff, tenant-scoped).
create or replace function public.get_subscriptions()
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'customer',customer_name,'email',customer_email,
    'item',item_name,'frequency',frequency,'amount',amount,'status',status,'currentPeriodEnd',current_period_end,
    'cancelAtPeriodEnd',cancel_at_period_end,'createdAt',created_at) order by created_at desc),'[]'::jsonb)
  from public.stripe_subscriptions where tenant_id = current_tenant();
$function$;

-- (7) Cancelar suscripción (CEO): cancel_at_period_end en Stripe + local.
create or replace function public.cancel_subscription(p_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public','vault','extensions'
as $function$
declare _sub text; _tid uuid; _sk text; _name text; _st int; _resp text;
begin
  select stripe_subscription_id, tenant_id into _sub, _tid from public.stripe_subscriptions where id=p_id;
  if _sub is null then return jsonb_build_object('error','not_found'); end if;
  if _tid <> current_tenant() or not is_ceo_or_above() then return jsonb_build_object('error','forbidden'); end if;
  select stripe_secret_vault_name into _name from public.tenant_payment_config where tenant_id=_tid and stripe_enabled;
  select decrypted_secret into _sk from vault.decrypted_secrets where name=_name limit 1;
  if _sk is null then return jsonb_build_object('error','no_secret'); end if;
  begin
    perform http_set_curlopt('CURLOPT_TIMEOUT_MS','9000');
    select status, content into _st, _resp from http(('POST','https://api.stripe.com/v1/subscriptions/'||_sub,
      array[http_header('Authorization','Bearer '||_sk)],'application/x-www-form-urlencoded','cancel_at_period_end=true')::http_request);
  exception when others then return jsonb_build_object('error','stripe_unreachable'); end;
  if _st=200 then update public.stripe_subscriptions set cancel_at_period_end=true, updated_at=now() where id=p_id;
    return jsonb_build_object('ok',true);
  else return jsonb_build_object('error','stripe_rejected','detail',coalesce((_resp::jsonb)->'error'->>'message','HTTP '||_st)); end if;
end $function$;

-- Grants: checkout anon; handlers de webhook solo service_role; lista/cancel authenticated (gated por RLS/rol).
grant execute on function public.create_stripe_subscription_checkout(text) to anon, authenticated;
revoke execute on function public.process_subscription_checkout(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.process_subscription_event(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.process_recurring_payment(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.process_failed_recurring_payment(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.get_subscriptions() to authenticated;
grant execute on function public.cancel_subscription(uuid) to authenticated;
