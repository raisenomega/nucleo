-- Migración 146: cobro coordinado manual Zafacones (ATH Móvil + Cash) + cron suscripciones + confirm cliente/Roy.
-- Arquitectura limpia para Place-to-Pay futuro (nuevo método = INSERT + nueva RPC, sin refactor). Solo tenant roy-ramos.
-- Correcciones pre-flight: +status 'awaiting_confirmation'; +method_key 'ath_movil_manual'/'placetopay'; +col config jsonb (no existía).

-- 1) Extender CHECKs
alter table public.tenant_landing_orders drop constraint tenant_landing_orders_status_check;
alter table public.tenant_landing_orders add constraint tenant_landing_orders_status_check
  check (status in ('pending','awaiting_payment','awaiting_confirmation','paid','processing','shipped','delivered','canceled','refunded'));
alter table public.tenant_payment_methods drop constraint tenant_payment_methods_method_key_check;
alter table public.tenant_payment_methods add constraint tenant_payment_methods_method_key_check
  check (method_key in ('stripe_connect','ath_movil','ath_movil_manual','bank_transfer','cash_on_delivery','offline_coordination','placetopay'));

-- 2) Columnas nuevas
alter table public.tenant_payment_methods add column if not exists config jsonb not null default '{}'::jsonb;
alter table public.tenant_landing_orders
  add column if not exists client_confirmed_at timestamptz,
  add column if not exists last_cycle_paid_at timestamptz,
  add column if not exists last_cycle_notify_sent_at timestamptz,
  add column if not exists cycles_paid int not null default 0;

-- 3) Helper: frecuencia → interval
create or replace function public._billing_frequency_to_interval(_freq text)
returns interval language sql immutable as $$
  select case _freq when '2w' then interval '14 days' when '4w' then interval '28 days' when '6w' then interval '42 days'
    when '8w' then interval '56 days' when '10w' then interval '70 days' else null end;
$$;

-- 4) Notif genérica al owner del tenant (in-app + email Resend white-label)
create or replace function public._notify_tenant_owner(_tenant uuid, _kind text, _title text, _body text, _entity uuid, _subject text, _html text)
returns void language plpgsql security definer set search_path to 'public', 'extensions' as $fn$
declare _uid uuid; _to text; _key text; _name text; _status int; _resp text;
begin
  select ur.user_id, pr.email into _uid, _to from public.user_roles ur join public.profiles pr on pr.id=ur.user_id
    where ur.tenant_id=_tenant and ur.role in ('ceo','superadmin') order by ur.role limit 1;
  insert into public.notifications(tenant_id,user_id,kind,title,body,entity_type,entity_id) values(_tenant,_uid,_kind,_title,_body,'order',_entity);
  select coalesce(nullif(trim(display_name),''),legal_name,'NÚCLEO') into _name from public.tenants where id=_tenant;
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _to is null or _key is null then return; end if;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)], 'application/json',
    jsonb_build_object('from',_name||' <noreply@raisen.agency>','to',_to,'subject',_subject,'html',_html)::text)::http_request);
  if _status is null or _status<200 or _status>=300 then raise warning '_notify_tenant_owner non-2xx=% entity=%',_status,_entity; end if;
exception when others then raise warning '_notify_tenant_owner EXCEPTION % entity=%', sqlerrm, _entity;
end $fn$;
revoke execute on function public._notify_tenant_owner(uuid,text,text,text,uuid,text,text) from public, anon, authenticated;

-- 5) Cliente confirmó envío ATH → notifica a Roy
create or replace function public._notify_order_awaiting_confirmation(_order_id uuid)
returns void language plpgsql security definer set search_path to 'public', 'extensions' as $fn$
declare _o public.tenant_landing_orders%rowtype; _html text;
begin
  select * into _o from public.tenant_landing_orders where id=_order_id;
  _html := '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#111827">'
    || '<h2>Cliente confirmó pago ATH Móvil '||public._html_escape(coalesce(_o.order_number,''))||'</h2>'
    || '<p><b>'||public._html_escape(coalesce(_o.customer_name,'Cliente'))||'</b> · '||public._html_escape(coalesce(_o.customer_phone,''))||'</p>'
    || '<p style="font-size:18px;font-weight:bold">$'||to_char(_o.total,'FM999990.00')||'</p>'
    || '<p>Verificá el pago en tu ATH Móvil y marcá la orden como cobrada (o reportá si no llegó).</p></div>';
  perform public._notify_tenant_owner(_o.tenant_id,'order_awaiting_confirmation','Cliente confirmó pago '||coalesce(_o.order_number,''),
    coalesce(_o.customer_name,'Cliente')||' · $'||to_char(_o.total,'FM999990.00'), _o.id,
    'Cliente confirmó pago ATH Móvil · '||coalesce(_o.order_number,''), _html);
end $fn$;
create or replace function public._on_order_status_notify()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
begin
  if new.status='awaiting_confirmation' and old.status is distinct from new.status then
    perform public._notify_order_awaiting_confirmation(new.id);
  end if;
  return new;
end $fn$;
drop trigger if exists trg_order_awaiting_confirm on public.tenant_landing_orders;
create trigger trg_order_awaiting_confirm after update of status on public.tenant_landing_orders
  for each row execute function public._on_order_status_notify();

-- 6) RPC pública: cliente marca "ya envié" (ATH). Rate limit 3/min. Idempotente por status.
create or replace function public._public_confirm_ath_movil_sent(_hostname text, _order_id uuid, _idempotency_key uuid default null, _client_ip text default null)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $fn$
declare _t uuid; _o record;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','invalid_origin'); end if;
  if not public._landing_rl('athconfirm:'||coalesce(_client_ip,'')||':'||coalesce(_hostname,''), 3) then
    return jsonb_build_object('status','error','code','rate_limited'); end if;
  select id, status, payment_method_key into _o from public.tenant_landing_orders where id=_order_id and tenant_id=_t;
  if not found then return jsonb_build_object('status','error','code','not_found'); end if;
  if _o.payment_method_key <> 'ath_movil_manual' then return jsonb_build_object('status','error','code','wrong_method'); end if;
  if _o.status = 'awaiting_confirmation' then return jsonb_build_object('status','ok','idempotent',true); end if;
  if _o.status <> 'pending' then return jsonb_build_object('status','error','code','bad_status'); end if;
  update public.tenant_landing_orders set status='awaiting_confirmation', client_confirmed_at=now() where id=_order_id;
  return jsonb_build_object('status','ok');
end $fn$;
grant execute on function public._public_confirm_ath_movil_sent(text,uuid,uuid,text) to anon, authenticated;

-- 7) Panel CEO: reportar pago no recibido → vuelve a pending + email cliente
create or replace function public.report_payment_not_received(_order_id uuid, _reason text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $fn$
declare _t uuid := current_tenant(); _o public.tenant_landing_orders%rowtype; _key text; _name text; _status int; _resp text;
begin
  if not public.is_ceo_or_above() then return jsonb_build_object('status','error','code','forbidden'); end if;
  select * into _o from public.tenant_landing_orders where id=_order_id and tenant_id=_t;
  if not found then return jsonb_build_object('status','error','code','not_found'); end if;
  perform set_config('app.order_note', 'Pago no verificado: '||coalesce(_reason,''), true);
  update public.tenant_landing_orders set status='pending' where id=_order_id;
  if coalesce(_o.customer_email,'') <> '' then
    select coalesce(nullif(trim(display_name),''),legal_name,'NÚCLEO') into _name from public.tenants where id=_t;
    select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
    if _key is not null then
      perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
      select status,content into _status,_resp from http(('POST','https://api.resend.com/emails',
        array[http_header('Authorization','Bearer '||_key)],'application/json',
        jsonb_build_object('from',_name||' <noreply@raisen.agency>','to',_o.customer_email,
          'subject','No pudimos verificar tu pago · '||coalesce(_o.order_number,''),
          'html','<p>No pudimos verificar tu pago de la orden '||public._html_escape(coalesce(_o.order_number,''))||'. Por favor contactanos para coordinar.</p>')::text)::http_request);
    end if;
  end if;
  return jsonb_build_object('status','ok');
exception when others then return jsonb_build_object('status','ok');
end $fn$;
grant execute on function public.report_payment_not_received(uuid,text) to authenticated;

-- 8) confirm_landing_order v2: +param nota, +payment_status, +bump ciclo suscripción
-- Drop del 3-arg para que las llamadas de 3 args resuelvan al nuevo (evita overload que mantendría el viejo sin bump).
drop function if exists public.confirm_landing_order(uuid, uuid, boolean);
create or replace function public.confirm_landing_order(_order_id uuid, _payment_method_id uuid default null, _create_invoice boolean default true, _note text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _t uuid := current_tenant(); _o public.tenant_landing_orders%rowtype;
        _cat uuid; _pm uuid; _income uuid; _invoice uuid; _lead uuid; _name text; _phone text; _sub boolean;
begin
  if not public.is_ceo_or_above() then return jsonb_build_object('status','error','code','forbidden'); end if;
  select * into _o from public.tenant_landing_orders where id = _order_id and tenant_id = _t;
  if not found then return jsonb_build_object('status','error','code','not_found'); end if;
  if _o.status in ('paid','refunded','canceled') then return jsonb_build_object('status','error','code','already_confirmed'); end if;
  _name := coalesce(nullif(trim(_o.customer_name),''),'Cliente web'); _phone := coalesce(_o.customer_phone,'');
  _sub := _o.order_type = 'subscription';
  _pm := _payment_method_id;
  if _pm is null then select id into _pm from public.categories where tenant_id=_t and kind='payment_method' and label='Efectivo' limit 1;
    if _pm is null then insert into public.categories(tenant_id,kind,label,sort) values(_t,'payment_method','Efectivo',90) returning id into _pm; end if; end if;
  select id into _cat from public.categories where tenant_id=_t and kind='income' and label='Venta web' limit 1;
  if _cat is null then insert into public.categories(tenant_id,kind,label,sort) values(_t,'income','Venta web',86) returning id into _cat; end if;
  insert into public.income(tenant_id,category_id,payment_method_id,amount,income_date,client_reference,order_number,notes,created_by)
    values(_t,_cat,_pm,_o.total,current_date,_name,_o.order_number,'Orden web '||coalesce(_o.order_number,''),auth.uid()) returning id into _income;
  _lead := _o.linked_lead_id;
  if _lead is null then
    select id into _lead from public.leads where tenant_id=_t and ((_o.customer_email is not null and email=_o.customer_email) or (_phone<>'' and phone=_phone)) limit 1;
    if _lead is null then
      insert into public.leads(tenant_id,contact_name,phone,email,service_requested,lead_source,temperature,status,attended_by)
        values(_t,_name,_phone,_o.customer_email,'Orden web '||coalesce(_o.order_number,''),'order-web','warm','Convertido',auth.uid()) returning id into _lead;
    end if;
  end if;
  if _create_invoice then
    insert into public.invoices(tenant_id,client_name,phone,email,items,subtotal,tax,total,status,paid_at,payment_method_id,linked_income_id,linked_lead_id,linked_order_id,created_by)
      values(_t,_name,_o.customer_phone,_o.customer_email,_o.items,_o.subtotal,_o.tax,_o.total,'paid',now(),_pm,_income,_lead,_order_id,auth.uid()) returning id into _invoice;
  end if;
  perform set_config('app.order_note', coalesce(_note,'Pago confirmado'), true);
  update public.tenant_landing_orders set status='paid', payment_status='paid', paid_at=now(), linked_lead_id=_lead, linked_invoice_id=_invoice, updated_at=now(),
    cycles_paid = case when _sub then _o.cycles_paid + 1 else _o.cycles_paid end,
    last_cycle_paid_at = case when _sub then now() else last_cycle_paid_at end,
    last_cycle_notify_sent_at = case when _sub then null else last_cycle_notify_sent_at end
  where id=_order_id;
  return jsonb_build_object('status','ok','income_id',_income,'invoice_id',_invoice,'lead_id',_lead);
end $fn$;
grant execute on function public.confirm_landing_order(uuid,uuid,boolean,text) to authenticated;

-- 9) Cron: ciclos de suscripción vencidos → alerta a Roy (NO auto-cobra). Idempotente por last_cycle_notify_sent_at.
create or replace function public._notify_subscription_cycle_due(_order_id uuid)
returns void language plpgsql security definer set search_path to 'public', 'extensions' as $fn$
declare _o public.tenant_landing_orders%rowtype; _html text; _cycle int;
begin
  select * into _o from public.tenant_landing_orders where id=_order_id;
  _cycle := _o.cycles_paid + 1;
  _html := '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#111827">'
    || '<h2>Ciclo '||_cycle||' pendiente de cobro '||public._html_escape(coalesce(_o.order_number,''))||'</h2>'
    || '<p><b>'||public._html_escape(coalesce(_o.customer_name,'Cliente'))||'</b> · $'||to_char(_o.total,'FM999990.00')||' · cada '||coalesce(_o.billing_frequency,'')||'</p>'
    || '<p>Coordiná el cobro del ciclo con el cliente y marcá la orden como cobrada.</p></div>';
  perform public._notify_tenant_owner(_o.tenant_id,'subscription_cycle_due','Ciclo '||_cycle||' pendiente '||coalesce(_o.order_number,''),
    coalesce(_o.customer_name,'Cliente')||' · $'||to_char(_o.total,'FM999990.00'), _o.id,
    'Ciclo '||_cycle||' pendiente de cobro · '||coalesce(_o.order_number,''), _html);
end $fn$;
create or replace function public.notify_subscription_cycles_due()
returns void language plpgsql security definer set search_path to 'public' as $fn$
declare _o record;
begin
  for _o in select id from public.tenant_landing_orders o
    where o.order_type='subscription' and o.status='paid' and o.billing_frequency is not null and o.cycles_paid >= 1
      and o.last_cycle_paid_at is not null
      and o.last_cycle_paid_at + public._billing_frequency_to_interval(o.billing_frequency) <= now()
      and (o.last_cycle_notify_sent_at is null or o.last_cycle_notify_sent_at < o.last_cycle_paid_at)
  loop
    perform public._notify_subscription_cycle_due(_o.id);
    update public.tenant_landing_orders set last_cycle_notify_sent_at=now() where id=_o.id;
  end loop;
end $fn$;
select cron.schedule('notify-subscription-cycles-daily', '0 12 * * *', $$select public.notify_subscription_cycles_due()$$);

-- 10) Payment methods Zafacones: desactiva offline, ajusta cash, inserta ATH Móvil (default)
update public.tenant_payment_methods set is_active=false where tenant_id='61205cb9-1418-4bfa-a029-bbb44d4e4310' and method_key='offline_coordination';
update public.tenant_payment_methods set is_default=false, display_order=2,
  display_name='{"es":"Efectivo al recibir el servicio","en":"Cash on delivery"}'::jsonb,
  config='{"instructions_es":"Prepara el pago en efectivo para cuando llegue el servicio. Nuestro personal coordinará contigo por WhatsApp al 787-624-5761.","instructions_en":"Prepare cash payment for when service arrives. Our staff will coordinate via WhatsApp at 787-624-5761."}'::jsonb
  where tenant_id='61205cb9-1418-4bfa-a029-bbb44d4e4310' and method_key='cash_on_delivery';
insert into public.tenant_payment_methods(tenant_id, method_key, is_active, is_default, display_name, config, display_order)
select '61205cb9-1418-4bfa-a029-bbb44d4e4310', 'ath_movil_manual', true, true,
  '{"es":"ATH Móvil","en":"ATH Móvil"}'::jsonb,
  '{"ath_number":"787-624-5761","instructions_es":"Envía el total a 787-624-5761 en tu app ATH Móvil. Después regresa aquí y confirma que enviaste el pago para que podamos verificarlo.","instructions_en":"Send the total to 787-624-5761 in your ATH Móvil app. Then come back and confirm you sent the payment so we can verify it."}'::jsonb, 1
where exists (select 1 from public.tenants where id='61205cb9-1418-4bfa-a029-bbb44d4e4310')
on conflict (tenant_id, method_key) do nothing;
