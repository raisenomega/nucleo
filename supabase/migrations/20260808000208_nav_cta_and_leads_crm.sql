-- 208 · Parte A (nav CTA header editable) + Parte B (CRM de leads completo). Sonda #14: cerrar los gaps
-- CRM vs OMEGA (temperatura, company, whatsapp, status converted/lost, email al lead). Solo ALTER (aditivo).

-- ===== PARTE A · CTA del header editable (en marketing_hero, junto al CTA del hero) =====
alter table public.marketing_hero
  add column if not exists nav_cta_label_es text not null default 'Solicitar demo',
  add column if not exists nav_cta_label_en text not null default 'Book a demo',
  add column if not exists nav_cta_href text not null default '/demo';

-- ===== PARTE B · enriquecer marketing_leads (CRM) =====
alter table public.marketing_leads
  add column if not exists company text,
  add column if not exists whatsapp_phone text,
  add column if not exists temperature text default 'cold';
alter table public.marketing_leads drop constraint if exists marketing_leads_temperature_check;
alter table public.marketing_leads add constraint marketing_leads_temperature_check
  check (temperature is null or temperature in ('cold','warm','hot','converted'));
alter table public.marketing_leads drop constraint if exists marketing_leads_status_check;
alter table public.marketing_leads add constraint marketing_leads_status_check
  check (status in ('new','contacted','qualified','converted','lost','archived'));

-- label del campo Empresa en el form público (editable)
alter table public.marketing_lead_form_config
  add column if not exists company_label_es text not null default 'Empresa (opcional)',
  add column if not exists company_label_en text not null default 'Company (optional)';

-- RPC create_lead: aceptar company (temperature = default 'cold'). Resto de validación/rate-limit intacto.
create or replace function public._marketing_create_lead(_payload jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _name text; _email text; _type text; _recent int; _lead uuid;
begin
  _name := trim(coalesce(_payload->>'customer_name',''));
  _email := lower(trim(coalesce(_payload->>'customer_email','')));
  _type := coalesce(_payload->>'lead_type','business');
  if _name = '' or _email = '' then
    return jsonb_build_object('status','error','code','invalid_payload','message','Nombre y email son requeridos'); end if;
  if _email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('status','error','code','invalid_email','message','Email inválido'); end if;
  if _type not in ('business','partner') then _type := 'business'; end if;
  select count(*) into _recent from public.marketing_leads
    where customer_email = _email and created_at > now() - interval '5 minutes';
  if _recent >= 3 then
    return jsonb_build_object('status','error','code','rate_limited','message','Demasiados intentos. Intenta más tarde.'); end if;
  insert into public.marketing_leads (lead_type, customer_name, customer_email, customer_phone, company, business_type, message, source_url, utm_source, utm_medium, utm_campaign)
  values (_type, _name, _email, nullif(trim(coalesce(_payload->>'customer_phone','')),''), nullif(trim(coalesce(_payload->>'company','')),''), nullif(trim(coalesce(_payload->>'business_type','')),''),
    nullif(trim(coalesce(_payload->>'message','')),''), _payload->>'source_url', _payload->>'utm_source', _payload->>'utm_medium', _payload->>'utm_campaign')
  returning id into _lead;
  return jsonb_build_object('status','ok','lead_id',_lead);
end $fn$;
grant execute on function public._marketing_create_lead(jsonb) to anon, authenticated;

-- RPC enviar email al lead (solo superadmin · Resend/http · error honesto). Patrón migr 203.
create or replace function public._marketing_email_lead(_lead_id uuid, _subject text, _body text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $fn$
declare _email text; _key text; _status int; _resp text;
begin
  if public.is_superadmin() is not true then return jsonb_build_object('status','error','message','No autorizado'); end if;  -- NULL (anon) → reject
  select customer_email into _email from public.marketing_leads where id = _lead_id;
  if _email is null then return jsonb_build_object('status','error','message','Lead no encontrado'); end if;
  if coalesce(trim(_subject),'')='' or coalesce(trim(_body),'')='' then return jsonb_build_object('status','error','message','Asunto y mensaje requeridos'); end if;
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then return jsonb_build_object('status','error','code','not_configured','message','Email no configurado en el servidor (falta RESEND_API_KEY).'); end if;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','8000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)],'application/json',
    jsonb_build_object('from','NÚCLEO <noreply@raisen.agency>','to',_email,'subject',left(_subject,200),
      'html','<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937;white-space:pre-wrap">'||public._html_escape(left(_body,5000))||'</div>')::text)::http_request);
  if _status is null or _status<200 or _status>=300 then
    return jsonb_build_object('status','error','code','resend_rejected','message','Resend rechazó el envío (dominio no verificado o error '||coalesce(_status,0)||').'); end if;
  return jsonb_build_object('status','ok');
end $fn$;
revoke execute on function public._marketing_email_lead(uuid, text, text) from public, anon;  -- solo superadmin (authenticated + check is_superadmin)
grant execute on function public._marketing_email_lead(uuid, text, text) to authenticated;
