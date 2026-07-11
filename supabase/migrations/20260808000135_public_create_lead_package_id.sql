-- Migración 135: _public_create_lead acepta package_id. Quote válido con service/product/package id.
-- Cambian 2 líneas vs migr 132: (a) validación quote incluye package_id; (b) service_requested une package_id.
-- CREATE OR REPLACE idempotente. SECURITY DEFINER + search_path + GRANT anon preservados. RLS/trigger sin cambios.
create or replace function public._public_create_lead(_hostname text, _payload jsonb, _client_ip text default 'unknown')
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $fn$
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
  values (_tenant, _name, coalesce(_payload->>'customer_phone',''), _email, nullif(_svc,''), 'web-landing', 'warm', 'Nuevo',
    concat_ws(E'\n', _payload->>'message', nullif('UTM: '||coalesce(_payload->'utm'->>'source',''),'UTM: ')), _ceo, _ceo)
  returning id into _lead;
  return jsonb_build_object('status','ok','lead_id',_lead,'confirmation_message','¡Gracias! Te contactaremos pronto.');
end $fn$;
grant execute on function public._public_create_lead(text, jsonb, text) to anon;
