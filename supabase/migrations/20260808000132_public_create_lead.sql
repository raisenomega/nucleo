-- Migración 132: puerta pública web→CRM (carril contacto→lead, sin Stripe).
alter table public.leads add column if not exists viewed_at timestamptz;

-- Índice parcial para el badge de leads web no-vistos (O(1)).
create index if not exists idx_leads_unseen_web
  on public.leads(tenant_id) where viewed_at is null and lead_source = 'web-landing';

-- Notifica al CEO del tenant por email (Resend). NO crítica: el trigger la aísla con EXCEPTION.
create or replace function public._notify_lead_created(_lead_id uuid)
returns void language plpgsql security definer set search_path to 'public','extensions' as $fn$
declare _l record; _key text; _to text; _name text; _status int; _resp text;
begin
  select l.* into _l from public.leads l where l.id = _lead_id;
  select coalesce(nullif(trim(t.display_name),''), t.legal_name, 'NÚCLEO') into _name from public.tenants t where t.id=_l.tenant_id;
  select pr.email into _to from public.user_roles ur join public.profiles pr on pr.id=ur.user_id
    where ur.tenant_id=_l.tenant_id and ur.role in ('ceo','superadmin') order by ur.role limit 1;
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _to is null or _key is null then raise warning 'notify_lead: falta email/key lead=%', _lead_id; return; end if;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)], 'application/json',
    jsonb_build_object('from', _name||' <noreply@raisen.agency>', 'to', _to,
      'subject', 'Nuevo lead web: '||_l.contact_name,
      'html', '<p>Nuevo lead desde tu web.</p><p><b>'||_l.contact_name||'</b><br>'||coalesce(_l.email,'')||' · '||coalesce(_l.phone,'')||'</p><p>'||coalesce(_l.notes,'')||'</p>')::text)::http_request);
  if _status is null or _status<200 or _status>=300 then raise warning 'notify_lead Resend no-2xx=% lead=%', _status, _lead_id; end if;
end $fn$;

-- Trigger AISLA la notificación: si Resend falla, el lead entra igual (email no es SPOF del carril).
create or replace function public._tg_notify_lead_web() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  begin perform public._notify_lead_created(new.id);
  exception when others then raise warning 'notify_lead_web fallo lead=%: %', new.id, sqlerrm; end;
  return new;
end $fn$;

drop trigger if exists trg_notify_lead_web on public.leads;
create trigger trg_notify_lead_web after insert on public.leads
  for each row when (new.lead_source = 'web-landing') execute function public._tg_notify_lead_web();

-- RPC pública anónima: crea lead desde form web. Origin whitelist + rate-limit(host+email+ip) + idempotencia.
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
  if _ft='quote' and (coalesce(_payload->>'message','')='' or (_payload->>'service_id' is null and _payload->>'product_id' is null)) then
    return jsonb_build_object('status','error','code','quote_incomplete','message','Cotización requiere mensaje y servicio/producto'); end if;
  if _ft='service_request' and (_payload->>'service_id' is null or _payload->>'preferred_date' is null) then
    return jsonb_build_object('status','error','code','service_incomplete','message','Falta servicio o fecha'); end if;
  _hits := public._public_rate_hit(encode(extensions.digest(_h||'|'||_email||'|'||coalesce(nullif(_client_ip,''),'unknown'),'sha256'),'hex'));
  if _hits > 5 then return jsonb_build_object('status','error','code','rate_limited','message','Demasiadas solicitudes'); end if;
  select id into _lead from public.leads where tenant_id=_tenant and email=_email and lead_source='web-landing'
    and created_at > now()-interval '60 seconds' limit 1;
  if _lead is not null then return jsonb_build_object('status','ok','lead_id',_lead,'confirmation_message','¡Gracias! Ya recibimos tu solicitud.'); end if;
  select user_id into _ceo from public.user_roles where tenant_id=_tenant and role in ('ceo','superadmin') order by role limit 1;
  _svc := concat_ws(' · ', nullif(_ft,''), _payload->>'service_id', _payload->>'product_id', _payload->>'preferred_date');
  insert into public.leads (tenant_id, contact_name, phone, email, service_requested, lead_source, temperature, status, notes, created_by, attended_by)
  values (_tenant, _name, coalesce(_payload->>'customer_phone',''), _email, nullif(_svc,''), 'web-landing', 'warm', 'Nuevo',
    concat_ws(E'\n', _payload->>'message', nullif('UTM: '||coalesce(_payload->'utm'->>'source',''),'UTM: ')), _ceo, _ceo)
  returning id into _lead;
  return jsonb_build_object('status','ok','lead_id',_lead,'confirmation_message','¡Gracias! Te contactaremos pronto.');
end $fn$;

grant execute on function public._public_create_lead(text, jsonb, text) to anon;

-- Seed piloto: habilitar el origen de la landing de Zafacones (allowed_origins estaba vacío).
update public.tenants set allowed_origins = '["zramos.com","www.zramos.com"]'::jsonb
  where slug='roy-ramos' and coalesce(jsonb_array_length(allowed_origins),0)=0;
