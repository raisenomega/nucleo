-- 20260808000113_invite_notify.sql
-- Notifica al empleado invitado (allowed_emails) para que se auto-registre en /invite.
-- Modelo self-signup INTACTO: solo agrega el aviso faltante. Envío best-effort vía Resend REST
-- (extensión http SÍNCRONA) — nunca bloquea la invitación. Key en Vault ('resend_api_key').

create extension if not exists http with schema extensions;

-- Escapa texto interpolado en el HTML del email (defensa ante nombres de negocio con < > & " ').
create or replace function public._html_escape(_input text)
returns text
language sql
immutable
as $$
  select replace(replace(replace(replace(replace(
    coalesce(_input, ''),
    '&', '&amp;'),
    '<', '&lt;'),
    '>', '&gt;'),
    '"', '&quot;'),
    '''', '&#39;');
$$;

create or replace function public._notify_invited()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  _cid uuid := gen_random_uuid();   -- correlation id: trazar esta invocación en los Postgres logs
  _name text; _site text; _inviter text; _key text;
  _subject text; _html text; _payload jsonb;
  _status int; _resp text; _recent int;
begin
  -- (cond 2) Rate limit: >10 del mismo tenant en 1 min -> WARNING, sin email, sin bloquear.
  select count(*) into _recent from public.allowed_emails
    where tenant_id = NEW.tenant_id and created_at > now() - interval '1 minute';
  if _recent > 10 then
    raise warning 'invite_notify [%] rate limit: tenant=% recientes=% email=%', _cid, NEW.tenant_id, _recent, NEW.email;
    return NEW;
  end if;

  -- Contexto negocio (white-label) + inviter (reply_to).
  select coalesce(nullif(trim(t.display_name), ''), t.legal_name, 'tu equipo'),
         coalesce(nullif(trim(t.primary_domain), ''), 'https://nucleo-blush.vercel.app')
    into _name, _site
    from public.tenants t where t.id = NEW.tenant_id;

  -- reply_to solo aparece cuando el INSERT viene de un request autenticado con JWT (flujo normal frontend).
  -- Para INSERTs administrativos directos (SQL manual, seed, migración de datos), auth.uid() = NULL,
  -- _inviter queda NULL, y el jsonb_build_object del reply_to se skippea. Aceptado por diseño.
  select u.email into _inviter from auth.users u where u.id = auth.uid();

  -- Key desde Vault (best-effort: si falta, WARNING y no envía).
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then
    raise warning 'invite_notify [%] falta secret resend_api_key en Vault; email no enviado a %', _cid, NEW.email;
    return NEW;
  end if;

  _subject := 'Te invitaron a ' || _name;   -- valor JSON (subject), no HTML -> sin escape
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

  _payload := jsonb_build_object(
    'from', _name || ' <noreply@raisen.agency>',   -- valor JSON (from), no HTML -> sin escape; nombre white-label
    'to', NEW.email,
    'subject', _subject,
    'html', _html);
  if _inviter is not null then
    _payload := _payload || jsonb_build_object('reply_to', _inviter);   -- (cond 6) responde al CEO
  end if;

  -- (cond 4) Timeout 5s + llamada SÍNCRONA -> status/body inline.
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '5000');
  select status, content into _status, _resp
    from http(('POST', 'https://api.resend.com/emails',
      array[http_header('Authorization', 'Bearer ' || _key)],
      'application/json', _payload::text)::http_request);

  if _status is null or _status < 200 or _status >= 300 then
    raise warning 'invite_notify [%] Resend no-2xx: status=% body=% email=% tenant=%',
      _cid, _status, _resp, NEW.email, NEW.tenant_id;
  end if;
  return NEW;
exception when others then
  -- best-effort: timeout/red/parse NO bloquean la invitación (igual filosofía que cond 2).
  raise warning 'invite_notify [%] EXCEPTION: sqlstate=% msg=% email=% tenant=%',
    _cid, sqlstate, sqlerrm, NEW.email, NEW.tenant_id;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_invited on public.allowed_emails;
create trigger trg_notify_invited
  after insert on public.allowed_emails
  for each row execute function public._notify_invited();
