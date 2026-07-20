-- 203 · Rodaja LeadForm + Leads Inbox E2E (platform-level). Config editable del form + tabla de leads
-- capturados. RPC _marketing_create_lead (validación + rate limit por email) = única puerta de escritura
-- del visitante. Email best-effort al Super Admin (Resend/http, patrón migr 113/132). Leads = solo lee superadmin.
create extension if not exists http with schema extensions;

create table if not exists public.marketing_lead_form_config (
  id uuid primary key default gen_random_uuid(),
  title_es text not null default 'Hablemos de tu negocio', title_en text not null default 'Let''s talk about your business',
  subtitle_es text not null default 'Déjanos tus datos y te contactamos.', subtitle_en text not null default 'Leave your details and we''ll reach out.',
  pill_business_es text not null default 'Para mi negocio', pill_business_en text not null default 'For my business',
  pill_partner_es text not null default 'Quiero ser partner', pill_partner_en text not null default 'I want to be a partner',
  cta_label_es text not null default 'Enviar', cta_label_en text not null default 'Send',
  success_es text not null default '¡Gracias! Te contactaremos pronto.', success_en text not null default 'Thanks! We''ll be in touch soon.',
  error_es text not null default 'No pudimos enviar tu mensaje. Intenta de nuevo.', error_en text not null default 'We couldn''t send your message. Please try again.',
  consent_es text not null default 'Al enviar aceptas que te contactemos sobre tu solicitud.', consent_en text not null default 'By submitting you agree to be contacted about your request.',
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  lead_type text not null default 'business' check (lead_type in ('business','partner')),
  customer_name text not null, customer_email text not null, customer_phone text,
  business_type text, message text, source_url text,
  utm_source text, utm_medium text, utm_campaign text,
  status text not null default 'new' check (status in ('new','contacted','qualified','archived')),
  notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_marketing_leads_new on public.marketing_leads(created_at desc) where status = 'new';

drop trigger if exists set_marketing_lead_form_config_updated_at on public.marketing_lead_form_config;
create trigger set_marketing_lead_form_config_updated_at before update on public.marketing_lead_form_config
  for each row execute function public.set_updated_at();
drop trigger if exists set_marketing_leads_updated_at on public.marketing_leads;
create trigger set_marketing_leads_updated_at before update on public.marketing_leads
  for each row execute function public.set_updated_at();

insert into public.marketing_lead_form_config (id) select gen_random_uuid()
  where not exists (select 1 from public.marketing_lead_form_config);

-- RLS: config lectura pública / escritura superadmin. leads = SOLO superadmin (el visitante escribe vía RPC).
alter table public.marketing_lead_form_config enable row level security;
alter table public.marketing_leads enable row level security;
drop policy if exists mlfc_select on public.marketing_lead_form_config;
create policy mlfc_select on public.marketing_lead_form_config for select using (true);
drop policy if exists mlfc_admin on public.marketing_lead_form_config;
create policy mlfc_admin on public.marketing_lead_form_config for all using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists mleads_admin on public.marketing_leads;
create policy mleads_admin on public.marketing_leads for all using (public.is_superadmin()) with check (public.is_superadmin());

-- RPC pública: crea lead desde el form comercial. Validación + rate limit (>=3 mismo email en 5 min).
-- SECURITY DEFINER → el insert bypassa RLS (el visitante NO tiene policy de insert directo). Devuelve jsonb.
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
  insert into public.marketing_leads (lead_type, customer_name, customer_email, customer_phone, business_type, message, source_url, utm_source, utm_medium, utm_campaign)
  values (_type, _name, _email, nullif(trim(coalesce(_payload->>'customer_phone','')),''), nullif(trim(coalesce(_payload->>'business_type','')),''),
    nullif(trim(coalesce(_payload->>'message','')),''), _payload->>'source_url', _payload->>'utm_source', _payload->>'utm_medium', _payload->>'utm_campaign')
  returning id into _lead;
  return jsonb_build_object('status','ok','lead_id',_lead);
end $fn$;
grant execute on function public._marketing_create_lead(jsonb) to anon, authenticated;

-- Email best-effort al Super Admin (Resend/http · key en Vault). Aislado: si falla, el lead entra igual.
create or replace function public._notify_marketing_lead()
returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $fn$
declare _cid uuid := gen_random_uuid(); _key text; _status int; _resp text; _to text := 'hola@raisen.agency';
begin
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then raise warning 'marketing_lead [%] falta resend_api_key; email no enviado lead=%', _cid, NEW.id; return NEW; end if;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '5000');
  select status, content into _status, _resp from http(('POST', 'https://api.resend.com/emails',
    array[http_header('Authorization', 'Bearer ' || _key)], 'application/json',
    jsonb_build_object('from', 'NÚCLEO <noreply@raisen.agency>', 'to', _to,
      'subject', 'Nuevo lead comercial: ' || NEW.customer_name,
      'html', '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">'
        || '<h2 style="color:#111827">Nuevo lead comercial</h2>'
        || '<p><strong>' || public._html_escape(NEW.customer_name) || '</strong> · ' || public._html_escape(NEW.lead_type) || '</p>'
        || '<p>' || public._html_escape(NEW.customer_email) || ' · ' || public._html_escape(coalesce(NEW.customer_phone, '—')) || '</p>'
        || case when coalesce(NEW.message,'') <> '' then '<p style="background:#f3f4f6;padding:12px;border-radius:8px">' || public._html_escape(NEW.message) || '</p>' else '' end
        || '<p style="font-size:12px;color:#9ca3af">' || to_char(NEW.created_at, 'YYYY-MM-DD HH24:MI') || ' · ' || public._html_escape(coalesce(NEW.source_url, '')) || '</p></div>')::text)::http_request);
  if _status is null or _status < 200 or _status >= 300 then
    raise warning 'marketing_lead [%] Resend no-2xx status=% body=% lead=%', _cid, _status, _resp, NEW.id; end if;
  return NEW;
exception when others then
  raise warning 'marketing_lead [%] EXCEPTION sqlstate=% msg=% lead=%', _cid, sqlstate, sqlerrm, NEW.id;
  return NEW;
end $fn$;

drop trigger if exists trg_notify_marketing_lead on public.marketing_leads;
create trigger trg_notify_marketing_lead after insert on public.marketing_leads
  for each row execute function public._notify_marketing_lead();
