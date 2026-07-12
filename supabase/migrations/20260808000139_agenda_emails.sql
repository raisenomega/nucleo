-- Migración 139: Agenda A-3 — emails transaccionales Resend (confirmación / recordatorio 24h / reagenda).
-- Patrón http+Resend de migr 122/123 (NO Edge Functions; no existen en este stack). White-label puro.
-- Idempotente por flags. Errores de email NUNCA hacen rollback de la cita (bloque exception).

-- 1) Schema: meeting_link + flags de tracking + toggle notify_client
alter table public.appointments
  add column if not exists meeting_link text,
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists reminder_email_sent_at timestamptz,
  add column if not exists reschedule_email_sent_at timestamptz,
  add column if not exists notify_client boolean not null default true;

create index if not exists idx_appointments_pending_confirmation
  on public.appointments(tenant_id, created_at)
  where confirmation_email_sent_at is null and notify_client = true and status in ('agendada','confirmada');
create index if not exists idx_appointments_pending_reminder
  on public.appointments(tenant_id, starts_at)
  where reminder_email_sent_at is null and notify_client = true and status in ('agendada','confirmada');

-- 2) Fecha legible en español, en la timezone del tenant
create or replace function public._fmt_dt_es(ts timestamptz, tz text)
returns text language sql immutable as $$
  select (array['lunes','martes','miércoles','jueves','viernes','sábado','domingo'])[extract(isodow from l)::int]
    || ' ' || extract(day from l)::text || ' de '
    || (array['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'])[extract(month from l)::int]
    || ' de ' || extract(year from l)::text || ', ' || to_char(l,'HH24:MI') || ' hs'
  from (select ts at time zone coalesce(nullif(tz,''),'America/Puerto_Rico') as l) x;
$$;

-- 3) Contexto del email (una query con joins: cita + lead + servicio + brand + contacto + tz)
create or replace function public._appointment_email_ctx(p_id uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'client_name', coalesce(l.contact_name,''), 'client_email', coalesce(l.email,''),
    'service_name', coalesce(nullif(trim(s.name),''), a.title), 'starts_at', a.starts_at, 'ends_at', a.ends_at,
    'notes', coalesce(a.notes,''), 'meeting_link', coalesce(a.meeting_link,''), 'notify_client', a.notify_client,
    'conf_sent', a.confirmation_email_sent_at is not null, 'rem_sent', a.reminder_email_sent_at is not null,
    'resc_sent', a.reschedule_email_sent_at is not null,
    'brand_name', coalesce(nullif(trim(t.display_name),''), t.legal_name, ''), 'logo_url', coalesce(th.logo_url,''),
    'accent', coalesce(nullif(th.accent_color,''), nullif(th.primary_color,''), '#111827'),
    'c_email', coalesce(lc.public_email,''), 'c_phone', coalesce(lc.public_phone,''), 'c_address', coalesce(lc.public_address,''),
    'tz', coalesce(nullif(aps.timezone,''),'America/Puerto_Rico'))
  from public.appointments a
  join public.tenants t on t.id = a.tenant_id
  left join public.leads l on l.id = a.lead_id
  left join public.tenant_landing_services s on s.id = a.service_id
  left join public.tenant_themes th on th.tenant_id = a.tenant_id
  left join public.tenant_landing_config lc on lc.tenant_id = a.tenant_id
  left join public.appointment_settings aps on aps.tenant_id = a.tenant_id
  where a.id = p_id;
$$;

-- 4) Template HTML puro (tabla-based, inline styles, Gmail/Outlook/Apple). Solo branding tenant.
create or replace function public._appointment_email_html(_ctx jsonb, p_kind text, p_prev timestamptz)
returns text language plpgsql stable set search_path to 'public' as $fn$
declare
  _acc text := _ctx->>'accent'; _name text := public._html_escape(_ctx->>'brand_name'); _tz text := _ctx->>'tz';
  _svc text := public._html_escape(_ctx->>'service_name');
  _when text := public._fmt_dt_es((_ctx->>'starts_at')::timestamptz, _tz);
  _dur int := round(extract(epoch from ((_ctx->>'ends_at')::timestamptz - (_ctx->>'starts_at')::timestamptz))/60)::int;
  _link text := _ctx->>'meeting_link'; _notes text := _ctx->>'notes';
  _intro text; _closing text; _btn text := ''; _prev text := ''; _notesrow text := ''; _contact text := '';
begin
  if p_kind = 'confirmation' then _intro := 'Tu cita está confirmada:'; _closing := 'Si necesitás modificar o cancelar, contactanos:';
  elsif p_kind = 'reminder' then _intro := 'Te recordamos tu cita para mañana:'; _closing := '¡Nos vemos entonces!';
  else _intro := 'Tu cita fue reprogramada.'; _closing := 'Cualquier pregunta, contactanos.'; end if;
  if p_kind = 'reschedule' and p_prev is not null then
    _prev := '<tr><td style="padding:4px 0;font-size:14px;color:#9ca3af"><span style="text-decoration:line-through">Antes: '
      || public._fmt_dt_es(p_prev,_tz) || '</span></td></tr>'; end if;
  if _link <> '' then _btn := '<tr><td style="padding:14px 0 2px"><a href="' || public._html_escape(_link)
    || '" style="background:' || _acc || ';color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:bold;display:inline-block">Unirse a la reunión</a></td></tr>'; end if;
  if _notes <> '' then _notesrow := '<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">'
    || public._html_escape(_notes) || '</td></tr>'; end if;
  _contact := coalesce(nullif(_ctx->>'c_email','') , '');
  _contact := _name
    || (case when _ctx->>'c_email' <> '' then '<br>' || public._html_escape(_ctx->>'c_email') else '' end)
    || (case when _ctx->>'c_phone' <> '' then ' · ' || public._html_escape(_ctx->>'c_phone') else '' end)
    || (case when _ctx->>'c_address' <> '' then '<br>' || public._html_escape(_ctx->>'c_address') else '' end);
  return '<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111827">'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 0;text-align:center;border-bottom:3px solid ' || _acc || '">'
    || (case when _ctx->>'logo_url' <> '' then '<img src="' || (_ctx->>'logo_url') || '" alt="' || _name || '" style="max-height:46px">'
        else '<span style="font-size:22px;font-weight:bold">' || _name || '</span>' end)
    || '</td></tr></table>'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 6px">'
    || '<p style="font-size:16px;margin:0 0 8px">Hola ' || public._html_escape(_ctx->>'client_name') || ',</p>'
    || '<p style="font-size:15px;color:#374151;margin:0 0 4px">' || _intro || '</p>'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:14px 0"><tr><td style="padding:16px"><table role="presentation" width="100%">'
    || _prev
    || '<tr><td style="padding:4px 0;font-size:16px;font-weight:bold">' || _svc || '</td></tr>'
    || '<tr><td style="padding:4px 0;font-size:15px;font-weight:bold;color:' || _acc || '">' || _when || '</td></tr>'
    || '<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Duración: ' || _dur || ' min</td></tr>'
    || _notesrow || _btn
    || '</table></td></tr></table>'
    || '<p style="font-size:14px;color:#374151;margin:8px 0 0">' || _closing || '</p>'
    || '</td></tr></table>'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:16px 6px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center">'
    || _contact || '</td></tr></table></div>';
end $fn$;

-- 5) Envío vía Resend (definer + extensions para http). Idempotente. Exception-safe (nunca rollback).
create or replace function public._send_appointment_email(p_id uuid, p_kind text, p_prev timestamptz default null)
returns void language plpgsql security definer set search_path to 'public, extensions' as $fn$
declare _ctx jsonb; _key text; _html text; _subj text; _from text; _to text; _status int; _resp text;
begin
  _ctx := public._appointment_email_ctx(p_id);
  if _ctx is null or not (_ctx->>'notify_client')::boolean then return; end if;
  _to := _ctx->>'client_email'; if coalesce(_to,'') = '' then return; end if;
  if (p_kind='confirmation' and (_ctx->>'conf_sent')::boolean)
     or (p_kind='reminder' and (_ctx->>'rem_sent')::boolean)
     or (p_kind='reschedule' and (_ctx->>'resc_sent')::boolean) then return; end if;
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then raise warning '_send_appointment_email falta resend_api_key apt=%', p_id; return; end if;
  _from := coalesce(nullif(_ctx->>'brand_name',''),'NÚCLEO') || ' <noreply@raisen.agency>';
  _subj := case p_kind
    when 'confirmation' then 'Cita confirmada · ' || (_ctx->>'service_name') || ' · ' || public._fmt_dt_es((_ctx->>'starts_at')::timestamptz, _ctx->>'tz')
    when 'reminder' then 'Recordatorio: tu cita mañana · ' || (_ctx->>'service_name')
    else 'Tu cita fue reagendada · ' || (_ctx->>'service_name') end;
  _html := public._appointment_email_html(_ctx, p_kind, p_prev);
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)], 'application/json',
    jsonb_build_object('from',_from,'to',_to,'subject',_subj,'html',_html)::text)::http_request);
  if _status is null or _status < 200 or _status >= 300 then
    raise warning '_send_appointment_email non-2xx status=% body=% apt=%', _status, _resp, p_id; return; end if;
  update public.appointments set
    confirmation_email_sent_at = case when p_kind='confirmation' then now() else confirmation_email_sent_at end,
    reminder_email_sent_at = case when p_kind='reminder' then now() else reminder_email_sent_at end,
    reschedule_email_sent_at = case when p_kind='reschedule' then now() else reschedule_email_sent_at end
  where id = p_id;
exception when others then
  raise warning '_send_appointment_email EXCEPTION sqlstate=% msg=% apt=%', sqlstate, sqlerrm, p_id;
end $fn$;
revoke execute on function public._send_appointment_email(uuid, text, timestamptz) from public, anon, authenticated;

-- 6) save_appointment: + meeting_link/notify_client, dispara confirmación (INSERT) y reagenda (UPDATE con cambio de starts_at)
create or replace function public.save_appointment(p_id uuid, p jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _t uuid := current_tenant(); _s timestamptz := (p->>'starts_at')::timestamptz; _e timestamptz := (p->>'ends_at')::timestamptz;
        _id uuid; _old_start timestamptz; _notify boolean := coalesce((p->>'notify_client')::boolean, true); _ml text := nullif(p->>'meeting_link','');
begin
  if not public.is_ceo_or_above() then return jsonb_build_object('status','error','code','forbidden'); end if;
  if _e <= _s then return jsonb_build_object('status','error','code','bad_range'); end if;
  if exists (select 1 from public.appointments a where a.tenant_id=_t and a.status in ('agendada','confirmada')
      and (p_id is null or a.id <> p_id) and a.starts_at < _e and a.ends_at > _s) then
    return jsonb_build_object('status','error','code','conflict'); end if;
  if exists (select 1 from public.blocked_periods b where b.tenant_id=_t and b.starts_at < _e and b.ends_at > _s) then
    return jsonb_build_object('status','error','code','blocked'); end if;
  if p_id is null then
    insert into public.appointments (tenant_id, lead_id, service_id, title, starts_at, ends_at, status, notes, created_by, meeting_link, notify_client)
    values (_t, nullif(p->>'lead_id','')::uuid, nullif(p->>'service_id','')::uuid, p->>'title', _s, _e, coalesce(p->>'status','agendada'), p->>'notes', auth.uid(), _ml, _notify)
    returning id into _id;
    perform public._send_appointment_email(_id, 'confirmation', null);
  else
    select starts_at into _old_start from public.appointments where id=p_id and tenant_id=_t;
    update public.appointments set lead_id=nullif(p->>'lead_id','')::uuid, service_id=nullif(p->>'service_id','')::uuid, title=p->>'title',
      starts_at=_s, ends_at=_e, status=coalesce(p->>'status','agendada'), notes=p->>'notes', meeting_link=_ml, notify_client=_notify, updated_at=now()
    where id=p_id and tenant_id=_t returning id into _id;
    if _id is not null and _old_start is distinct from _s then
      update public.appointments set reminder_email_sent_at = null where id=_id;
      perform public._send_appointment_email(_id, 'reschedule', _old_start);
    end if;
  end if;
  return jsonb_build_object('status','ok','id',_id);
end $fn$;
grant execute on function public.save_appointment(uuid, jsonb) to authenticated;

-- 7) Recordatorio 24h por EMAIL dentro del cron existente (in-app 24h/1h intacto)
create or replace function public.notify_upcoming_appointments()
returns void language plpgsql security definer set search_path to 'public' as $fn$
begin
  insert into public.notifications (tenant_id, user_id, kind, title, body, entity_type, entity_id)
  select a.tenant_id, a.created_by, k.kind, a.title, to_char(a.starts_at,'YYYY-MM-DD HH24:MI'), 'appointment', a.id
  from public.appointments a
  cross join lateral (values ('appointment_reminder_24h', interval '24 hours', interval '30 minutes'),
                             ('appointment_reminder_1h', interval '1 hour', interval '15 minutes')) k(kind, ahead, tol)
  where a.status in ('agendada','confirmada') and a.created_by is not null
    and a.starts_at between now() + k.ahead - k.tol and now() + k.ahead + k.tol
    and not exists (select 1 from public.notifications n where n.entity_id=a.id and n.kind=k.kind);
  perform public._send_appointment_email(a.id, 'reminder', null)
  from public.appointments a
  where a.status in ('agendada','confirmada') and a.notify_client = true and a.reminder_email_sent_at is null
    and a.starts_at between now() + interval '23 hours' and now() + interval '25 hours';
end $fn$;
