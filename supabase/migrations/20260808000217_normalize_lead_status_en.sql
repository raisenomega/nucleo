-- 217 · Ola 1.1 · Normalizar estados del CRM del tenant (leads) a inglés.
--
-- BUG (auditoría ERP): la tabla `leads` mezclaba estados en español ('Nuevo'/'Convertido') con inglés. La UI
-- (lead.constants: new/contacted/quoted/converted/lost) y los snapshots (get_crm_snapshot, get_report_series)
-- cuentan SOLO inglés → los leads de formularios públicos y de conversión de órdenes quedaban sin contar en el
-- dashboard CRM ni en conversión/revenue por canal.
--
-- Alcance verificado contra la DB VIVA (no contra archivos de migración, que estaban superseded):
--   · Datos: solo existían 5 filas 'Nuevo' (0 'Convertido').
--   · Funciones vivas con el literal español: EXACTAMENTE 3 — _public_create_lead, _public_create_service_request,
--     confirm_landing_order. Las otras 5 que el grep de archivos mostraba ya fueron reemplazadas por versiones
--     sin el literal. Estas 3 se redefinen ABAJO con su cuerpo VIVO EXACTO (extraído con pg_get_functiondef),
--     cambiando únicamente el literal de status. Cero cambios de lógica.
--   · NO se toca `marketing_leads` (plataforma) — está sana, ya usa inglés + su propio CHECK.

-- 1 · Datos existentes → inglés.
update public.leads set status = 'new'       where status = 'Nuevo';
update public.leads set status = 'converted' where status = 'Convertido';
update public.leads set status = 'contacted' where status = 'Contactado';
update public.leads set status = 'quoted'    where status = 'Cotizado';
update public.leads set status = 'lost'      where status = 'Perdido';

-- 2 · Default de la tabla → inglés (antes 'Nuevo', de la migr 007).
alter table public.leads alter column status set default 'new';

-- 3 · Funciones vivas corregidas (cuerpo verbatim de pg_get_functiondef, solo cambia el literal de status).

CREATE OR REPLACE FUNCTION public._public_create_lead(_hostname text, _payload jsonb, _client_ip text DEFAULT 'unknown'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare _h text; _tenant uuid; _ceo uuid; _ft text; _name text; _email text; _svc text; _hits int; _lead uuid;
begin
  _h := regexp_replace(lower(trim(coalesce(_hostname,''))), '^www\.', '');
  select t.id into _tenant from public.tenants t where t.landing_enabled and exists (
    select 1 from jsonb_array_elements_text(coalesce(t.allowed_origins,'[]'::jsonb)) o
    where regexp_replace(lower(trim(o)), '^https?://|^www\.|/.*$', '', 'g') = _h) limit 1;
  if _tenant is null then return jsonb_build_object('status','error','code','origin_not_allowed','message','Origen no autorizado'); end if;
  _ft := _payload->>'form_type'; _name := trim(coalesce(_payload->>'customer_name','')); _email := lower(trim(coalesce(_payload->>'customer_email','')));
  if _ft not in ('contact','quote','service_request') or _name='' or _email='' then
    return jsonb_build_object('status','error','code','invalid_payload','message','Datos incompletos'); end if;
  if _ft='contact' and coalesce(_payload->>'message','')='' then
    return jsonb_build_object('status','error','code','message_required','message','Falta el mensaje'); end if;
  if _ft='quote' and (coalesce(_payload->>'message','')='' or (_payload->>'service_id' is null and _payload->>'product_id' is null and _payload->>'package_id' is null)) then
    return jsonb_build_object('status','error','code','quote_incomplete','message','Cotización requiere mensaje y servicio/producto/paquete'); end if;
  if _ft='service_request' and (_payload->>'service_id' is null or _payload->>'preferred_date' is null) then
    return jsonb_build_object('status','error','code','service_incomplete','message','Falta servicio o fecha'); end if;
  _hits := public._public_rate_hit(encode(extensions.digest(_h||'|'||_email||'|'||coalesce(nullif(_client_ip,''),'unknown'),'sha256'),'hex'));
  if _hits > 5 then return jsonb_build_object('status','error','code','rate_limited','message','Demasiadas solicitudes'); end if;
  select id into _lead from public.leads where tenant_id=_tenant and email=_email and lead_source='web-landing'
    and created_at > now()-interval '60 seconds' limit 1;
  if _lead is not null then return jsonb_build_object('status','ok','lead_id',_lead,'confirmation_message','¡Gracias! Ya recibimos tu solicitud.'); end if;
  select user_id into _ceo from public.user_roles where tenant_id=_tenant and role in ('ceo','superadmin') order by role limit 1;
  _svc := concat_ws(' · ', nullif(_ft,''), _payload->>'service_id', _payload->>'product_id', _payload->>'package_id', _payload->>'preferred_date');
  insert into public.leads (tenant_id, contact_name, phone, email, service_requested, lead_source, temperature, status, notes, created_by, attended_by)
  values (_tenant, _name, coalesce(_payload->>'customer_phone',''), _email, nullif(_svc,''), 'web-landing', 'warm', 'new',
    concat_ws(E'\n', _payload->>'message', nullif('UTM: '||coalesce(_payload->'utm'->>'source',''),'UTM: ')), _ceo, _ceo)
  returning id into _lead;
  return jsonb_build_object('status','ok','lead_id',_lead,'confirmation_message','¡Gracias! Te contactaremos pronto.');
end $function$;

CREATE OR REPLACE FUNCTION public._public_create_service_request(_hostname text, _slug text, _payload jsonb, _client_ip text DEFAULT 'unknown'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare _t uuid; _ceo uuid; _name text; _email text; _hits int; _lead uuid; _cf jsonb; _notes text;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','origin_not_allowed'); end if;
  _name := btrim(concat_ws(' ', _payload->>'firstName', _payload->>'lastName'));
  _email := lower(btrim(coalesce(_payload->>'email','')));
  if _name='' or _email='' or coalesce(_payload->>'phone','')='' or coalesce(_payload->>'serviceType','')='' then
    return jsonb_build_object('status','error','code','invalid_payload'); end if;
  _hits := public._public_rate_hit(encode(extensions.digest(_hostname||'|'||_email||'|'||coalesce(nullif(_client_ip,''),'unknown'),'sha256'),'hex'));
  if _hits > 5 then return jsonb_build_object('status','error','code','rate_limited'); end if;
  select user_id into _ceo from public.user_roles where tenant_id=_t and role in ('ceo','superadmin') order by role limit 1;
  _cf := case when jsonb_typeof(_payload->'custom_fields')='array' then _payload->'custom_fields' else '[]'::jsonb end;
  _notes := 'Solicitud '||_slug || coalesce(E'\n' || (select string_agg((c->>'label')||': '||(c->>'value'), E'\n') from jsonb_array_elements(_cf) c), '');
  insert into public.leads (tenant_id, contact_name, phone, email, service_requested, lead_source, temperature, status, notes, custom_fields, created_by, attended_by)
    values (_t, _name, _payload->>'phone', _email, coalesce(nullif(_payload->>'serviceTypeLabel',''), _payload->>'serviceType'), _slug||'-request', 'warm', 'new', _notes, _cf, _ceo, _ceo)
    returning id into _lead;
  return jsonb_build_object('status','ok','lead_id',_lead);
end $function$;

CREATE OR REPLACE FUNCTION public.confirm_landing_order(_order_id uuid, _payment_method_id uuid DEFAULT NULL::uuid, _create_invoice boolean DEFAULT true, _note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare _t uuid := current_tenant(); _o public.tenant_landing_orders%rowtype;
        _cat uuid; _pm uuid; _income uuid; _invoice uuid; _lead uuid; _name text; _phone text; _sub boolean;
        _it jsonb; _inv_id uuid; _qty numeric;
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
        values(_t,_name,_phone,_o.customer_email,'Orden web '||coalesce(_o.order_number,''),'order-web','warm','converted',auth.uid()) returning id into _lead;
    end if;
  end if;
  if _create_invoice then
    insert into public.invoices(tenant_id,client_name,phone,email,items,subtotal,tax,total,status,paid_at,payment_method_id,linked_income_id,linked_lead_id,linked_order_id,created_by)
      values(_t,_name,_o.customer_phone,_o.customer_email,_o.items,_o.subtotal,_o.tax,_o.total,'paid',now(),_pm,_income,_lead,_order_id,auth.uid()) returning id into _invoice;
  end if;
  -- BLOQUE 3: descuento de stock por productos vendidos vinculados a inventario
  for _it in select * from jsonb_array_elements(coalesce(_o.items,'[]'::jsonb)) loop
    if _it->>'kind' = 'product' then
      _qty := coalesce((_it->>'qty')::numeric, 1);
      select id into _inv_id from public.inventory_items where landing_product_id = (_it->>'id')::uuid and tenant_id = _t;
      if _inv_id is not null and _qty > 0 then
        insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, linked_order_id, notes, created_by, movement_date)
          values(_t, _inv_id, 'venta_publica', _qty, 0, _order_id, 'Venta web #'||coalesce(_o.order_number,''), auth.uid(), current_date);
        update public.inventory_items set stock = stock - _qty, updated_at = now() where id = _inv_id and tenant_id = _t;
        update public.tenant_landing_products set stock_quantity = (select stock from public.inventory_items where id = _inv_id), updated_at = now()
          where id = (_it->>'id')::uuid and tenant_id = _t;
      end if;
    end if;
  end loop;
  perform set_config('app.order_note', coalesce(_note,'Pago confirmado'), true);
  update public.tenant_landing_orders set status='paid', payment_status='paid', paid_at=now(), linked_lead_id=_lead, linked_invoice_id=_invoice, updated_at=now(),
    cycles_paid = case when _sub then _o.cycles_paid + 1 else _o.cycles_paid end,
    last_cycle_paid_at = case when _sub then now() else last_cycle_paid_at end,
    last_cycle_notify_sent_at = case when _sub then null else last_cycle_notify_sent_at end
  where id=_order_id;
  return jsonb_build_object('status','ok','income_id',_income,'invoice_id',_invoice,'lead_id',_lead);
end $function$;

-- 4 · CHECK para que no reincida. Va AL FINAL: después de normalizar datos y funciones, para que no falle.
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check
  check (status in ('new','contacted','quoted','converted','lost'));
