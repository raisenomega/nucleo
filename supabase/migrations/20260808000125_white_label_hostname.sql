-- FASE 2 white-label — resolución de branding por hostname (N tenants).
-- 0) Guard anti-colisión. 1) Normaliza primary_domain. 2) CHECK lowercase + unique index.
-- 3) brand_by_hostname (anon). 4) Actualiza las 3 funciones que construían el site URL.

-- 0) FIX 1 — Guard: aborta si dos tenants colisionan tras normalizar (misma expresión que el UPDATE).
do $guard$
declare _conflict_count int;
begin
  select count(*) into _conflict_count from (
    select regexp_replace(regexp_replace(lower(trim(primary_domain)), '^https?://', ''), '/.*$', '') as n
    from public.tenants where primary_domain is not null and primary_domain <> ''
    group by 1 having count(*) > 1
  ) t;
  if _conflict_count > 0 then
    raise exception 'Migración 125 abortada: % primary_domains colisionan tras normalización. Limpiar manualmente antes de re-aplicar.', _conflict_count;
  end if;
end $guard$;

-- 1) Normalizar primary_domain: sin scheme, sin path, lowercase, trim. Idempotente.
update public.tenants
   set primary_domain = regexp_replace(regexp_replace(lower(trim(primary_domain)), '^https?://', ''), '/.*$', '')
 where primary_domain is not null and primary_domain <> '';

-- 2a) FIX 2 — CHECK lowercase: rechaza mayúsculas a nivel DB (previene bugs de lookup futuros).
alter table public.tenants drop constraint if exists chk_primary_domain_lowercase;
alter table public.tenants add constraint chk_primary_domain_lowercase
  check (primary_domain is null or primary_domain = lower(primary_domain));

-- 2b) Unique index parcial: si hay primary_domain, es único (case-insensitive). Permite NULL.
create unique index if not exists idx_tenants_primary_domain
  on public.tenants(lower(primary_domain)) where primary_domain is not null;

-- 3) RPC pública: branding por hostname (pre-login). Cero data sensible; no lista tenants.
create or replace function public.brand_by_hostname(_hostname text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $fn$
declare _h text; _t record;
  _fallback jsonb := jsonb_build_object('display_name','Portal','legal_name','Portal',
    'primary_color','#1f2937','accent_color','#374151','logo_url',null,'favicon_url',null,
    'contact_phone',null,'tenant_id',null,'is_fallback',true);
begin
  _h := regexp_replace(lower(trim(coalesce(_hostname,''))), '^www\.', '');   -- normaliza + quita www.

  -- Throttle best-effort 60/5min por (hostname+IP). Reusa _public_rate_hit (P2.A). Degrada a fallback.
  if public._public_rate_hit('brand:'||_h) > 60 then
    return _fallback || jsonb_build_object('status','rate_limited'); end if;

  -- Dominios operacionales de Raisen → branding NÚCLEO fijo (whitelist).
  if _h in ('nucleoraisen.com','nucleo-blush.vercel.app') then
    return jsonb_build_object('display_name','NÚCLEO by raisen','legal_name','NÚCLEO by raisen',
      'primary_color','#1a1a2e','accent_color','#4a4a6a','logo_url',null,'favicon_url',null,
      'contact_phone',null,'tenant_id',null,'is_fallback',false,'is_raisen',true);
  end if;

  select t.id, t.display_name, t.legal_name, t.contact_phone,
         th.primary_color, th.accent_color, th.logo_url, th.favicon_url
    into _t from public.tenants t
    left join public.tenant_themes th on th.tenant_id = t.id
    where lower(t.primary_domain) = _h limit 1;
  if not found then return _fallback; end if;

  return jsonb_build_object(
    'tenant_id',_t.id,
    'display_name',coalesce(nullif(trim(_t.display_name),''),_t.legal_name,'Portal'),
    'legal_name',_t.legal_name,
    'primary_color',coalesce(_t.primary_color,'#1a1a2e'),
    'accent_color',coalesce(_t.accent_color,'#4a4a6a'),
    'logo_url',_t.logo_url,'favicon_url',_t.favicon_url,
    'contact_phone',_t.contact_phone,'is_fallback',false);
end $fn$;

grant execute on function public.brand_by_hostname(text) to anon, authenticated;

-- 4a) create_quote_approval_token: site URL = https:// + primary_domain (o nucleoraisen.com).
create or replace function public.create_quote_approval_token(p_quote_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  _cid uuid := gen_random_uuid();
  _tenant uuid := current_tenant();
  _q record; _rl int; _token text; _expires_at timestamptz; _site text;
begin
  if not public.can_access_module('quotes','edit') then raise exception 'No autorizado'; end if;
  select id, tenant_id, status into _q from public.quotes where id = p_quote_id and tenant_id = _tenant;
  if not found then raise exception 'quote no encontrada o fuera de tenant'; end if;
  if _q.status not in ('draft','sent','viewed') then raise exception 'estado % no admite envío', _q.status; end if;

  select count(*) into _rl from public.quote_approvals
   where tenant_id = _tenant and created_at > now() - interval '10 minutes';
  if _rl >= 20 then
    raise warning 'create_quote_approval_token [%] rate_limited tenant=% count=%', _cid, _tenant, _rl;
    return jsonb_build_object('error','rate_limited'); end if;

  update public.quote_approvals set expires_at = now()
   where quote_id = p_quote_id and response is null and expires_at > now();

  _token := encode(extensions.gen_random_bytes(24), 'hex');
  _expires_at := now() + interval '30 days';
  insert into public.quote_approvals(quote_id, tenant_id, token_hash, expires_at, created_by)
  values (p_quote_id, _tenant, encode(extensions.digest(_token,'sha256'),'hex'), _expires_at, auth.uid());

  select 'https://' || coalesce(nullif(trim(t.primary_domain),''), 'nucleoraisen.com')
    into _site from public.tenants t where t.id = _tenant;

  return jsonb_build_object('token_plain', _token, 'approval_url', _site || '/aprobar/' || _token, 'expires_at', _expires_at);
exception when others then
  raise warning 'create_quote_approval_token [%] EXCEPTION: sqlstate=% msg=% quote=%', _cid, sqlstate, sqlerrm, p_quote_id;
  raise;
end $fn$;

-- 4b) _quote_email_html: mismo cambio de site URL.
create or replace function public._quote_email_html(p_quote_id uuid, p_token_plain text, p_message text)
returns text language plpgsql security definer set search_path = public as $fn$
declare _q record; _name text; _site text; _approval text;
begin
  select q.quote_number, q.tenant_id into _q from public.quotes q where q.id = p_quote_id;
  select coalesce(nullif(trim(t.display_name),''), t.legal_name, 'NÚCLEO'),
         'https://' || coalesce(nullif(trim(t.primary_domain),''), 'nucleoraisen.com')
    into _name, _site from public.tenants t where t.id = _q.tenant_id;
  _approval := _site || '/aprobar/' || p_token_plain;

  return '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">'
    || '<h2 style="color:#111827">' || _html_escape(_name) || '</h2>'
    || case when coalesce(trim(p_message),'') <> '' then
         '<p style="font-size:15px">' || _html_escape(p_message) || '</p>' else '' end
    || '<p style="font-size:15px">Te compartimos tu cotización <strong>'
    || _html_escape(coalesce(_q.quote_number,'')) || '</strong>.</p>'
    || '<p style="text-align:center;margin:28px 0">'
    || '<a href="' || _html_escape(_approval) || '" style="background:#16a34a;color:#fff;'
    || 'text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block">'
    || 'Ver y responder cotización</a></p>'
    || '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">'
    || '<p style="font-size:12px;color:#9ca3af">Enviado por ' || _html_escape(_name) || '.</p></div>';
end $fn$;

-- 4c) _notify_invited (trigger): mismo cambio de site URL. Resto idéntico.
create or replace function public._notify_invited()
returns trigger language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $fn$
declare
  _cid uuid := gen_random_uuid();
  _name text; _site text; _inviter text; _key text;
  _subject text; _html text; _payload jsonb; _status int; _resp text; _recent int;
begin
  select count(*) into _recent from public.allowed_emails
    where tenant_id = NEW.tenant_id and created_at > now() - interval '1 minute';
  if _recent > 10 then
    raise warning 'invite_notify [%] rate limit: tenant=% recientes=% email=%', _cid, NEW.tenant_id, _recent, NEW.email;
    return NEW; end if;

  select coalesce(nullif(trim(t.display_name), ''), t.legal_name, 'tu equipo'),
         'https://' || coalesce(nullif(trim(t.primary_domain), ''), 'nucleoraisen.com')
    into _name, _site from public.tenants t where t.id = NEW.tenant_id;

  select u.email into _inviter from auth.users u where u.id = auth.uid();
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then
    raise warning 'invite_notify [%] falta secret resend_api_key en Vault; email no enviado a %', _cid, NEW.email;
    return NEW; end if;

  _subject := 'Te invitaron a ' || _name;
  _html :=
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">'
    || '<p style="font-size:16px">Hola,</p>'
    || '<p style="font-size:16px">Tu administrador te invitó a formar parte de <strong>' || _html_escape(_name) || '</strong>.</p>'
    || '<p style="font-size:16px">Haz click en el siguiente botón para crear tu cuenta:</p>'
    || '<p style="text-align:center;margin:28px 0"><a href="' || _html_escape(_site) || '/invite" '
    || 'style="background:#111827;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block">Crear mi cuenta</a></p>'
    || '<p style="font-size:14px;color:#4b5563">Usa el correo <strong>' || _html_escape(NEW.email) || '</strong> para registrarte.</p>'
    || '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">'
    || '<p style="font-size:12px;color:#9ca3af">Este correo fue enviado por la plataforma que ' || _html_escape(_name) || ' usa para gestionar su negocio.</p>'
    || '</div>';

  _payload := jsonb_build_object('from', _name || ' <noreply@raisen.agency>', 'to', NEW.email, 'subject', _subject, 'html', _html);
  if _inviter is not null then _payload := _payload || jsonb_build_object('reply_to', _inviter); end if;

  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '5000');
  select status, content into _status, _resp
    from http(('POST', 'https://api.resend.com/emails',
      array[http_header('Authorization', 'Bearer ' || _key)], 'application/json', _payload::text)::http_request);
  if _status is null or _status < 200 or _status >= 300 then
    raise warning 'invite_notify [%] Resend no-2xx: status=% body=% email=% tenant=%', _cid, _status, _resp, NEW.email, NEW.tenant_id;
  end if;
  return NEW;
exception when others then
  raise warning 'invite_notify [%] EXCEPTION: sqlstate=% msg=% email=% tenant=%', _cid, sqlstate, sqlerrm, NEW.email, NEW.tenant_id;
  return NEW;
end $fn$;
