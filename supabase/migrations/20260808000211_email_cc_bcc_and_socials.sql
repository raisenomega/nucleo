-- 211 · (1) Email al lead/reserva desde el inbox con CC/BCC. (2) Seed de las 6 redes reales del footer.
-- El RPC de lead cambia de firma (3→5 args) → se DROPEA el viejo para evitar ambigüedad por defaults.

drop function if exists public._marketing_email_lead(uuid, text, text);

-- Email a un LEAD (solo superadmin · Resend · cc/bcc opcionales). is_superadmin() puede ser NULL (anon) → `is not true`.
create or replace function public._marketing_email_lead(_lead_id uuid, _subject text, _body text, _cc text default '', _bcc text default '')
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $fn$
declare _email text; _key text; _status int; _resp text; _payload jsonb;
begin
  if public.is_superadmin() is not true then return jsonb_build_object('status','error','message','No autorizado'); end if;
  select customer_email into _email from public.marketing_leads where id = _lead_id;
  if _email is null then return jsonb_build_object('status','error','message','Lead no encontrado'); end if;
  if coalesce(trim(_subject),'')='' or coalesce(trim(_body),'')='' then return jsonb_build_object('status','error','message','Asunto y mensaje requeridos'); end if;
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then return jsonb_build_object('status','error','code','not_configured','message','Email no configurado en el servidor (falta RESEND_API_KEY).'); end if;
  _payload := jsonb_build_object('from','NÚCLEO <noreply@raisen.agency>','to',_email,'subject',left(_subject,200),
    'html', public._marketing_email_html(left(_subject,200), '<p>'||public._html_escape(left(_body,5000))||'</p>'));
  if coalesce(trim(_cc),'') <> '' then _payload := _payload || jsonb_build_object('cc', trim(_cc)); end if;
  if coalesce(trim(_bcc),'') <> '' then _payload := _payload || jsonb_build_object('bcc', trim(_bcc)); end if;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','8000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)],'application/json', _payload::text)::http_request);
  if _status is null or _status<200 or _status>=300 then
    return jsonb_build_object('status','error','code','resend_rejected','message','Resend rechazó el envío ('||coalesce(_status,0)||'). Verifica el dominio o los CC/BCC.'); end if;
  return jsonb_build_object('status','ok');
end $fn$;
revoke execute on function public._marketing_email_lead(uuid, text, text, text, text) from public, anon;
grant execute on function public._marketing_email_lead(uuid, text, text, text, text) to authenticated;

-- Email a una RESERVA (mismo patrón; el cuerpo incluye la cita agendada).
create or replace function public._marketing_email_reservation(_res_id uuid, _subject text, _body text, _cc text default '', _bcc text default '')
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $fn$
declare _r record; _key text; _status int; _resp text; _payload jsonb; _when text;
begin
  if public.is_superadmin() is not true then return jsonb_build_object('status','error','message','No autorizado'); end if;
  select customer_email, customer_name, reservation_date, reservation_time, duration_minutes into _r
    from public.marketing_reservations where id = _res_id;
  if _r.customer_email is null then return jsonb_build_object('status','error','message','Reserva no encontrada'); end if;
  if coalesce(trim(_subject),'')='' or coalesce(trim(_body),'')='' then return jsonb_build_object('status','error','message','Asunto y mensaje requeridos'); end if;
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then return jsonb_build_object('status','error','code','not_configured','message','Email no configurado en el servidor (falta RESEND_API_KEY).'); end if;
  _when := to_char(_r.reservation_date,'YYYY-MM-DD')||' · '||to_char(_r.reservation_time,'HH24:MI')||' ('||_r.duration_minutes||' min)';
  _payload := jsonb_build_object('from','NÚCLEO <noreply@raisen.agency>','to',_r.customer_email,'subject',left(_subject,200),
    'html', public._marketing_email_html(left(_subject,200),
      '<p>'||public._html_escape(left(_body,5000))||'</p><p style="color:#eea62b;font-weight:bold">📅 '||_when||'</p>'));
  if coalesce(trim(_cc),'') <> '' then _payload := _payload || jsonb_build_object('cc', trim(_cc)); end if;
  if coalesce(trim(_bcc),'') <> '' then _payload := _payload || jsonb_build_object('bcc', trim(_bcc)); end if;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','8000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)],'application/json', _payload::text)::http_request);
  if _status is null or _status<200 or _status>=300 then
    return jsonb_build_object('status','error','code','resend_rejected','message','Resend rechazó el envío ('||coalesce(_status,0)||'). Verifica el dominio o los CC/BCC.'); end if;
  return jsonb_build_object('status','ok');
end $fn$;
revoke execute on function public._marketing_email_reservation(uuid, text, text, text, text) from public, anon;
grant execute on function public._marketing_email_reservation(uuid, text, text, text, text) to authenticated;

-- Redes del footer: normaliza icon_name de las conocidas (ej. 'Camera' → 'instagram') y siembra las faltantes.
update public.marketing_footer_social_links set icon_name = lower(platform)
  where lower(platform) in ('facebook','instagram','youtube','linkedin','whatsapp','tiktok') and icon_name <> lower(platform);

insert into public.marketing_footer_social_links (platform, url, icon_name, display_order)
select v.platform, v.url, v.icon, v.ord from (values
  ('Facebook','https://facebook.com/raisen','facebook',1),
  ('Instagram','https://instagram.com/raisen','instagram',2),
  ('YouTube','https://youtube.com/@raisen','youtube',3),
  ('LinkedIn','https://linkedin.com/company/raisen','linkedin',4),
  ('WhatsApp','https://wa.me/17875551234','whatsapp',5),
  ('TikTok','https://tiktok.com/@raisen','tiktok',6)
) as v(platform, url, icon, ord)
where not exists (select 1 from public.marketing_footer_social_links s where lower(s.platform) = lower(v.platform));
