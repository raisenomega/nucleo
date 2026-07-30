-- MARKETING-LEADS-DEUDA TAREA 3: reemplazar el email hardcoded 'hola@raisen.agency' de los triggers de
-- marketing (lead + reserva) por un array de config editable. El único superadmin es una cuenta de dev
-- (dev@nucleo.com), no un buzón de negocio → columna `notification_emails` en marketing_lead_form_config
-- (singleton platform-level), default al buzón real. Ambos triggers leen de ahí y Resend acepta `to` como array.

alter table public.marketing_lead_form_config add column if not exists notification_emails text[];
update public.marketing_lead_form_config set notification_emails = array['nucleoraisen@gmail.com'] where notification_emails is null;

CREATE OR REPLACE FUNCTION public._notify_marketing_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare _key text; _cfg record; _es boolean := NEW.lang <> 'en'; _sub text; _html text; _st int; _rp text; _emails text[];
begin
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then raise warning 'lead email: falta resend_api_key lead=%', NEW.id; return NEW; end if;
  select notification_emails into _emails from public.marketing_lead_form_config limit 1;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '3000');
  begin -- admin
    _html := '<h2 style="color:#111827">Nuevo lead comercial</h2><p><strong>'||public._html_escape(NEW.customer_name)||'</strong> · '||public._html_escape(NEW.lead_type)||'</p><p>'||public._html_escape(NEW.customer_email)||' · '||public._html_escape(coalesce(NEW.customer_phone,'—'))||' · '||public._html_escape(coalesce(NEW.company,'—'))||'</p>'||case when coalesce(NEW.message,'')<>'' then '<p style="background:#f3f4f6;padding:12px;border-radius:8px">'||public._html_escape(NEW.message)||'</p>' else '' end;
    select status, content into _st, _rp from http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],'application/json',
      jsonb_build_object('from','NÚCLEO <noreply@raisen.agency>','to',coalesce(_emails, array['nucleoraisen@gmail.com']),'subject','Nuevo lead comercial: '||NEW.customer_name,'html','<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">'||_html||'</div>')::text)::http_request);
  exception when others then raise warning 'lead admin email fail lead=%: %', NEW.id, sqlerrm; end;
  if NEW.campaign_page_id is null then begin -- confirmación al visitante (solo leads NO-campaña)
    select confirmation_subject_es, confirmation_subject_en, confirmation_body_es, confirmation_body_en into _cfg from public.marketing_lead_form_config limit 1;
    _sub := case when _es then _cfg.confirmation_subject_es else _cfg.confirmation_subject_en end;
    _html := public._marketing_email_html(case when _es then '¡Gracias, '||public._html_escape(NEW.customer_name)||'!' else 'Thank you, '||public._html_escape(NEW.customer_name)||'!' end,
      '<p>'||public._html_escape(case when _es then _cfg.confirmation_body_es else _cfg.confirmation_body_en end)||'</p>'||case when coalesce(NEW.message,'')<>'' then '<p style="color:#83868e;font-size:13px">'||(case when _es then 'Tu mensaje: ' else 'Your message: ' end)||public._html_escape(NEW.message)||'</p>' else '' end);
    select status, content into _st, _rp from http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],'application/json',
      jsonb_build_object('from','NÚCLEO <noreply@raisen.agency>','to',NEW.customer_email,'subject',_sub,'html',_html)::text)::http_request);
  exception when others then raise warning 'lead visitor email fail lead=%: %', NEW.id, sqlerrm; end; end if;
  return NEW;
exception when others then raise warning 'lead notify fail lead=%: %', NEW.id, sqlerrm; return NEW;
end $function$
;

CREATE OR REPLACE FUNCTION public._notify_marketing_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare _key text; _cfg record; _es boolean := NEW.lang <> 'en'; _sub text; _html text; _when text; _st int; _rp text; _emails text[];
begin
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then raise warning 'res email: falta resend_api_key res=%', NEW.id; return NEW; end if;
  select confirmation_subject_es, confirmation_subject_en, confirmation_body_es, confirmation_body_en, timezone into _cfg from public.marketing_availability limit 1;
  _when := to_char(NEW.reservation_date,'YYYY-MM-DD')||' · '||to_char(NEW.reservation_time,'HH24:MI')||' ('||NEW.duration_minutes||' min · '||coalesce(_cfg.timezone,'')||')';
  select notification_emails into _emails from public.marketing_lead_form_config limit 1;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '3000');
  begin -- admin
    select status, content into _st, _rp from http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],'application/json',
      jsonb_build_object('from','NÚCLEO <noreply@raisen.agency>','to',coalesce(_emails, array['nucleoraisen@gmail.com']),'subject','Nueva reserva de demo: '||NEW.customer_name,
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
end $function$
;

