-- 209 · Emails de confirmación al VISITANTE (lead + reserva). Cierra gap #3 de la sonda #14. Antes solo se
-- notificaba al admin; ahora el visitante también recibe confirmación. Patrón migr 203/113 (http+Resend, best-
-- effort aislado). Idioma capturado por lang (default 'es'). Asunto/cuerpo editables en las tablas config.
create extension if not exists http with schema extensions;

-- Shell HTML branded (estilo template signup de OMEGA: dark + dorado + "NÚCLEO by RAISEN"). _body_html ya viene escapado.
create or replace function public._marketing_email_html(_heading text, _body_html text)
returns text language sql immutable as $$
  select '<div style="background:#0b0d14;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">'
    || '<div style="max-width:520px;margin:0 auto;background:#13151f;border:1px solid #23252d;border-radius:12px;overflow:hidden">'
    || '<div style="padding:28px;text-align:center;border-bottom:1px solid #23252d">'
    || '<div style="font-size:26px;font-weight:700;letter-spacing:0.12em;color:#eea62b">NÚCLEO.</div>'
    || '<div style="margin-top:6px;font-size:10px;letter-spacing:0.2em;color:#83868e;text-transform:uppercase">by RAISEN</div></div>'
    || '<div style="padding:28px;color:#c5c3be;font-size:15px;line-height:1.6">'
    || '<h1 style="margin:0 0 16px;font-size:20px;color:#e8e6e2">' || _heading || '</h1>' || _body_html
    || '<p style="margin-top:28px"><a href="https://nucleoraisen.com" style="color:#eea62b;text-decoration:none">nucleoraisen.com</a></p>'
    || '</div></div></div>';
$$;

-- lang del visitante + templates de confirmación editables
alter table public.marketing_leads add column if not exists lang text not null default 'es';
alter table public.marketing_reservations add column if not exists lang text not null default 'es';
alter table public.marketing_lead_form_config
  add column if not exists confirmation_subject_es text not null default 'Recibimos tu solicitud — NÚCLEO',
  add column if not exists confirmation_subject_en text not null default 'We received your request — NÚCLEO',
  add column if not exists confirmation_body_es text not null default 'Gracias por tu interés. Recibimos tu solicitud y te contactaremos muy pronto.',
  add column if not exists confirmation_body_en text not null default 'Thanks for your interest. We received your request and will contact you very soon.';
alter table public.marketing_availability
  add column if not exists confirmation_subject_es text not null default 'Tu demo está confirmada — NÚCLEO',
  add column if not exists confirmation_subject_en text not null default 'Your demo is confirmed — NÚCLEO',
  add column if not exists confirmation_body_es text not null default 'Tu demo quedó confirmada. Te esperamos.',
  add column if not exists confirmation_body_en text not null default 'Your demo is confirmed. We look forward to it.';

-- RPC create_lead: acepta lang (resto intacto)
create or replace function public._marketing_create_lead(_payload jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _name text; _email text; _type text; _lang text; _recent int; _lead uuid;
begin
  _name := trim(coalesce(_payload->>'customer_name','')); _email := lower(trim(coalesce(_payload->>'customer_email','')));
  _type := coalesce(_payload->>'lead_type','business'); _lang := case when _payload->>'lang' = 'en' then 'en' else 'es' end;
  if _name = '' or _email = '' then return jsonb_build_object('status','error','code','invalid_payload','message','Nombre y email son requeridos'); end if;
  if _email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then return jsonb_build_object('status','error','code','invalid_email','message','Email inválido'); end if;
  if _type not in ('business','partner') then _type := 'business'; end if;
  select count(*) into _recent from public.marketing_leads where customer_email = _email and created_at > now() - interval '5 minutes';
  if _recent >= 3 then return jsonb_build_object('status','error','code','rate_limited','message','Demasiados intentos. Intenta más tarde.'); end if;
  insert into public.marketing_leads (lead_type, customer_name, customer_email, customer_phone, company, business_type, message, source_url, utm_source, utm_medium, utm_campaign, lang)
  values (_type, _name, _email, nullif(trim(coalesce(_payload->>'customer_phone','')),''), nullif(trim(coalesce(_payload->>'company','')),''), nullif(trim(coalesce(_payload->>'business_type','')),''),
    nullif(trim(coalesce(_payload->>'message','')),''), _payload->>'source_url', _payload->>'utm_source', _payload->>'utm_medium', _payload->>'utm_campaign', _lang)
  returning id into _lead;
  return jsonb_build_object('status','ok','lead_id',_lead);
end $fn$;
grant execute on function public._marketing_create_lead(jsonb) to anon, authenticated;

-- RPC create_reservation: acepta lang (resto intacto: re-valida slot → anti doble-booking)
create or replace function public._marketing_create_reservation(_payload jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _c record; _name text; _email text; _date date; _time time; _lang text; _id uuid;
begin
  select * into _c from public.marketing_availability limit 1;
  if _c is null then return jsonb_build_object('status','error','code','no_config','message','No disponible'); end if;
  _name := trim(coalesce(_payload->>'customer_name','')); _email := lower(trim(coalesce(_payload->>'customer_email','')));
  _lang := case when _payload->>'lang' = 'en' then 'en' else 'es' end;
  if _name='' or _email='' then return jsonb_build_object('status','error','code','invalid_payload','message','Nombre y email son requeridos'); end if;
  if _email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then return jsonb_build_object('status','error','code','invalid_email','message','Email inválido'); end if;
  begin _date := (_payload->>'reservation_date')::date; _time := (_payload->>'reservation_time')::time;
  exception when others then return jsonb_build_object('status','error','code','invalid_slot','message','Fecha u hora inválida'); end;
  if not (public._marketing_available_slots(_date) ? to_char(_time,'HH24:MI')) then
    return jsonb_build_object('status','error','code','slot_taken','message','Ese horario ya no está disponible'); end if;
  insert into public.marketing_reservations (customer_name, customer_email, customer_phone, reservation_date, reservation_time, duration_minutes, notes, lang)
  values (_name, _email, nullif(trim(coalesce(_payload->>'customer_phone','')),''), _date, _time, _c.duration_minutes, nullif(trim(coalesce(_payload->>'message','')),''), _lang)
  returning id into _id;
  return jsonb_build_object('status','ok','reservation_id',_id);
end $fn$;
grant execute on function public._marketing_create_reservation(jsonb) to anon, authenticated;

-- Trigger lead: email al ADMIN + confirmación al VISITANTE (cada uno aislado · timeout 3s).
create or replace function public._notify_marketing_lead()
returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $fn$
declare _key text; _cfg record; _es boolean := NEW.lang <> 'en'; _sub text; _html text; _st int; _rp text;
begin
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then raise warning 'lead email: falta resend_api_key lead=%', NEW.id; return NEW; end if;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '3000');
  begin -- admin
    _html := '<h2 style="color:#111827">Nuevo lead comercial</h2><p><strong>'||public._html_escape(NEW.customer_name)||'</strong> · '||public._html_escape(NEW.lead_type)||'</p><p>'||public._html_escape(NEW.customer_email)||' · '||public._html_escape(coalesce(NEW.customer_phone,'—'))||' · '||public._html_escape(coalesce(NEW.company,'—'))||'</p>'||case when coalesce(NEW.message,'')<>'' then '<p style="background:#f3f4f6;padding:12px;border-radius:8px">'||public._html_escape(NEW.message)||'</p>' else '' end;
    select status, content into _st, _rp from http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],'application/json',
      jsonb_build_object('from','NÚCLEO <noreply@raisen.agency>','to','hola@raisen.agency','subject','Nuevo lead comercial: '||NEW.customer_name,'html','<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">'||_html||'</div>')::text)::http_request);
  exception when others then raise warning 'lead admin email fail lead=%: %', NEW.id, sqlerrm; end;
  begin -- confirmación al visitante
    select confirmation_subject_es, confirmation_subject_en, confirmation_body_es, confirmation_body_en into _cfg from public.marketing_lead_form_config limit 1;
    _sub := case when _es then _cfg.confirmation_subject_es else _cfg.confirmation_subject_en end;
    _html := public._marketing_email_html(case when _es then '¡Gracias, '||public._html_escape(NEW.customer_name)||'!' else 'Thank you, '||public._html_escape(NEW.customer_name)||'!' end,
      '<p>'||public._html_escape(case when _es then _cfg.confirmation_body_es else _cfg.confirmation_body_en end)||'</p>'||case when coalesce(NEW.message,'')<>'' then '<p style="color:#83868e;font-size:13px">'||(case when _es then 'Tu mensaje: ' else 'Your message: ' end)||public._html_escape(NEW.message)||'</p>' else '' end);
    select status, content into _st, _rp from http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],'application/json',
      jsonb_build_object('from','NÚCLEO <noreply@raisen.agency>','to',NEW.customer_email,'subject',_sub,'html',_html)::text)::http_request);
  exception when others then raise warning 'lead visitor email fail lead=%: %', NEW.id, sqlerrm; end;
  return NEW;
exception when others then raise warning 'lead notify fail lead=%: %', NEW.id, sqlerrm; return NEW;
end $fn$;

-- Trigger reserva: email al ADMIN + confirmación al VISITANTE (con fecha/hora/duración/tz).
create or replace function public._notify_marketing_reservation()
returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $fn$
declare _key text; _cfg record; _es boolean := NEW.lang <> 'en'; _sub text; _html text; _when text; _st int; _rp text;
begin
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then raise warning 'res email: falta resend_api_key res=%', NEW.id; return NEW; end if;
  select confirmation_subject_es, confirmation_subject_en, confirmation_body_es, confirmation_body_en, timezone into _cfg from public.marketing_availability limit 1;
  _when := to_char(NEW.reservation_date,'YYYY-MM-DD')||' · '||to_char(NEW.reservation_time,'HH24:MI')||' ('||NEW.duration_minutes||' min · '||coalesce(_cfg.timezone,'')||')';
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '3000');
  begin -- admin
    select status, content into _st, _rp from http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],'application/json',
      jsonb_build_object('from','NÚCLEO <noreply@raisen.agency>','to','hola@raisen.agency','subject','Nueva reserva de demo: '||NEW.customer_name,
        'html','<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937"><h2 style="color:#111827">Nueva reserva de demo</h2><p><strong>'||public._html_escape(NEW.customer_name)||'</strong></p><p>'||public._html_escape(NEW.customer_email)||' · '||public._html_escape(coalesce(NEW.customer_phone,'—'))||'</p><p><strong>'||_when||'</strong></p></div>')::text)::http_request);
  exception when others then raise warning 'res admin email fail res=%: %', NEW.id, sqlerrm; end;
  begin -- confirmación al visitante
    _sub := case when _es then _cfg.confirmation_subject_es else _cfg.confirmation_subject_en end;
    _html := public._marketing_email_html(case when _es then '¡Reserva confirmada, '||public._html_escape(NEW.customer_name)||'!' else 'Booking confirmed, '||public._html_escape(NEW.customer_name)||'!' end,
      '<p>'||public._html_escape(case when _es then _cfg.confirmation_body_es else _cfg.confirmation_body_en end)||'</p><p style="background:#0b0d14;border:1px solid #23252d;border-radius:8px;padding:14px;color:#eea62b;font-weight:bold">📅 '||_when||'</p>');
    select status, content into _st, _rp from http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],'application/json',
      jsonb_build_object('from','NÚCLEO <noreply@raisen.agency>','to',NEW.customer_email,'subject',_sub,'html',_html)::text)::http_request);
  exception when others then raise warning 'res visitor email fail res=%: %', NEW.id, sqlerrm; end;
  return NEW;
exception when others then raise warning 'res notify fail res=%: %', NEW.id, sqlerrm; return NEW;
end $fn$;
