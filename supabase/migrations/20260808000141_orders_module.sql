-- Migración 141: Órdenes 1 — order_status_history + confirm_landing_order + notif Roy (in-app + email).
-- Sobre tenant_landing_orders (única tabla tras consolidación #67). Status reales: pending/awaiting_payment/
-- paid/processing/shipped/delivered/canceled/refunded. income se vincula por order_number (no hay linked_order_id).

-- 1) Historial de estados
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.tenant_landing_orders(id) on delete cascade,
  from_status text, to_status text not null,
  changed_by uuid references auth.users(id), note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_status_history_order on public.order_status_history(order_id, created_at desc);
alter table public.order_status_history enable row level security;
drop policy if exists order_status_history_select on public.order_status_history;
create policy order_status_history_select on public.order_status_history for select using (tenant_id = current_tenant());

-- 2) Trigger: registra creación + cada cambio de status
create or replace function public._track_order_status()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (tenant_id, order_id, from_status, to_status, changed_by)
      values (new.tenant_id, new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (tenant_id, order_id, from_status, to_status, changed_by, note)
      values (new.tenant_id, new.id, old.status, new.status, auth.uid(), nullif(current_setting('app.order_note', true), ''));
  end if;
  return new;
end $fn$;
drop trigger if exists trg_track_order_status_ins on public.tenant_landing_orders;
create trigger trg_track_order_status_ins after insert on public.tenant_landing_orders
  for each row execute function public._track_order_status();
drop trigger if exists trg_track_order_status_upd on public.tenant_landing_orders;
create trigger trg_track_order_status_upd after update of status on public.tenant_landing_orders
  for each row execute function public._track_order_status();

-- 3) confirm_landing_order: marca pagada → income (retención auto) + lead + invoice opcional. Idempotente.
create or replace function public.confirm_landing_order(_order_id uuid, _payment_method_id uuid default null, _create_invoice boolean default true)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _t uuid := current_tenant(); _o public.tenant_landing_orders%rowtype;
        _cat uuid; _pm uuid; _income uuid; _invoice uuid; _lead uuid; _name text; _phone text;
begin
  if not public.is_ceo_or_above() then return jsonb_build_object('status','error','code','forbidden'); end if;
  select * into _o from public.tenant_landing_orders where id = _order_id and tenant_id = _t;
  if not found then return jsonb_build_object('status','error','code','not_found'); end if;
  if _o.status in ('paid','refunded','canceled') then
    return jsonb_build_object('status','error','code','already_confirmed'); end if;
  _name := coalesce(nullif(trim(_o.customer_name),''),'Cliente web'); _phone := coalesce(_o.customer_phone,'');
  -- método de pago (usa el pasado, o crea/usa 'Efectivo')
  _pm := _payment_method_id;
  if _pm is null then select id into _pm from public.categories where tenant_id=_t and kind='payment_method' and label='Efectivo' limit 1;
    if _pm is null then insert into public.categories(tenant_id,kind,label,sort) values(_t,'payment_method','Efectivo',90) returning id into _pm; end if; end if;
  -- categoría de ingreso 'Venta web'
  select id into _cat from public.categories where tenant_id=_t and kind='income' and label='Venta web' limit 1;
  if _cat is null then insert into public.categories(tenant_id,kind,label,sort) values(_t,'income','Venta web',86) returning id into _cat; end if;
  -- income (trigger trg_income_retention aplica retención auto). Vínculo por order_number.
  insert into public.income(tenant_id,category_id,payment_method_id,amount,income_date,client_reference,order_number,notes,created_by)
    values(_t,_cat,_pm,_o.total,current_date,_name,_o.order_number,'Orden web '||coalesce(_o.order_number,''),auth.uid()) returning id into _income;
  -- lead: linkea existente por email/phone, o crea 'Convertido'
  _lead := _o.linked_lead_id;
  if _lead is null then
    select id into _lead from public.leads where tenant_id=_t and ((_o.customer_email is not null and email=_o.customer_email) or (_phone<>'' and phone=_phone)) limit 1;
    if _lead is null then
      insert into public.leads(tenant_id,contact_name,phone,email,service_requested,lead_source,temperature,status,attended_by)
        values(_t,_name,_phone,_o.customer_email,'Orden web '||coalesce(_o.order_number,''),'order-web','warm','Convertido',auth.uid()) returning id into _lead;
    end if;
  end if;
  -- invoice opcional (invoice_number auto vía set_invoice_number)
  if _create_invoice then
    insert into public.invoices(tenant_id,client_name,phone,email,items,subtotal,tax,total,status,paid_at,payment_method_id,linked_income_id,linked_lead_id,linked_order_id,created_by)
      values(_t,_name,_o.customer_phone,_o.customer_email,_o.items,_o.subtotal,_o.tax,_o.total,'paid',now(),_pm,_income,_lead,_order_id,auth.uid()) returning id into _invoice;
  end if;
  perform set_config('app.order_note', 'Pago confirmado', true);
  update public.tenant_landing_orders set status='paid', paid_at=now(), linked_lead_id=_lead, linked_invoice_id=_invoice, updated_at=now() where id=_order_id;
  return jsonb_build_object('status','ok','income_id',_income,'invoice_id',_invoice,'lead_id',_lead);
end $fn$;
grant execute on function public.confirm_landing_order(uuid, uuid, boolean) to authenticated;

-- 3b) Cambio manual de estado con nota (la nota la captura el trigger vía app.order_note)
create or replace function public.change_order_status(_order_id uuid, _status text, _note text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _t uuid := current_tenant(); _id uuid;
begin
  if not public.is_ceo_or_above() then return jsonb_build_object('status','error','code','forbidden'); end if;
  perform set_config('app.order_note', coalesce(_note, ''), true);
  update public.tenant_landing_orders set status=_status, updated_at=now()
    where id=_order_id and tenant_id=_t returning id into _id;
  if _id is null then return jsonb_build_object('status','error','code','not_found'); end if;
  return jsonb_build_object('status','ok','id',_id);
end $fn$;
grant execute on function public.change_order_status(uuid, text, text) to authenticated;

-- 4) Notificación al CEO (in-app + email Resend, patrón _notify_lead_created). White-label.
create or replace function public._notify_order_created(_order_id uuid)
returns void language plpgsql security definer set search_path to 'public', 'extensions' as $fn$
declare _o public.tenant_landing_orders%rowtype; _key text; _to text; _uid uuid; _name text; _dom text;
        _url text; _btn text := ''; _html text; _status int; _resp text;
begin
  select * into _o from public.tenant_landing_orders where id = _order_id;
  select coalesce(nullif(trim(t.display_name),''), t.legal_name, 'NÚCLEO'), t.primary_domain into _name, _dom
    from public.tenants t where t.id = _o.tenant_id;
  select ur.user_id, pr.email into _uid, _to from public.user_roles ur join public.profiles pr on pr.id=ur.user_id
    where ur.tenant_id=_o.tenant_id and ur.role in ('ceo','superadmin') order by ur.role limit 1;
  insert into public.notifications (tenant_id, user_id, kind, title, body, entity_type, entity_id)
    values (_o.tenant_id, _uid, 'order_new', 'Nueva orden web '||coalesce(_o.order_number,''),
            coalesce(_o.customer_name,'Cliente')||' · $'||to_char(_o.total,'FM999999990.00'), 'order', _o.id);
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _to is null or _key is null then raise warning '_notify_order_created falta email/key order=%', _order_id; return; end if;
  if _dom is not null then _url := 'https://app.'||_dom||'/orders/'||_order_id;
    _btn := '<tr><td style="padding:14px 0"><a href="'||_url||'" style="background:#111827;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:bold;display:inline-block">Ver en panel</a></td></tr>'; end if;
  _html := '<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111827">'
    || '<h2 style="font-size:18px">Nueva orden web '||public._html_escape(coalesce(_o.order_number,''))||'</h2>'
    || '<table role="presentation" width="100%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px"><tr><td style="padding:16px"><table width="100%">'
    || '<tr><td style="padding:4px 0;font-size:15px"><strong>'||public._html_escape(coalesce(_o.customer_name,'Cliente'))||'</strong></td></tr>'
    || '<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">'||public._html_escape(coalesce(_o.customer_email,''))||' · '||public._html_escape(coalesce(_o.customer_phone,''))||'</td></tr>'
    || '<tr><td style="padding:8px 0;font-size:18px;font-weight:bold">$'||to_char(_o.total,'FM999999990.00')||' '||coalesce(_o.currency,'USD')||'</td></tr>'
    || _btn || '</table></td></tr></table>'
    || '<p style="font-size:12px;color:#9ca3af;margin-top:16px">'||public._html_escape(_name)||'</p></div>';
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)], 'application/json',
    jsonb_build_object('from',_name||' <noreply@raisen.agency>','to',_to,
      'subject','Nueva orden web · '||coalesce(_o.order_number,'')||' · $'||to_char(_o.total,'FM999999990.00'),'html',_html)::text)::http_request);
  if _status is null or _status<200 or _status>=300 then raise warning '_notify_order_created Resend no-2xx=% order=%', _status, _order_id; end if;
exception when others then raise warning '_notify_order_created EXCEPTION % order=%', sqlerrm, _order_id;
end $fn$;
revoke execute on function public._notify_order_created(uuid) from public, anon, authenticated;

-- 5) Trigger: nueva orden (INSERT) → notifica. (El INSERT público llega en Órdenes 2.)
create or replace function public._on_order_insert()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
begin
  perform public._notify_order_created(new.id);
  return new;
end $fn$;
drop trigger if exists trg_notify_order_created on public.tenant_landing_orders;
create trigger trg_notify_order_created after insert on public.tenant_landing_orders
  for each row execute function public._on_order_insert();
