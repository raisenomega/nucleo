-- SIDE-5 · Privilegios sobre `authenticated` + emails que fallaban en silencio.
-- Origen: auditoría E2E 2026-08-01, hallazgos §12 #1, #5 y #8.
--
-- Contexto de por qué esto importa ahora: los arcos SIDE-1→4 cerraron la superficie ANON con rigor. La
-- superficie AUTHENTICATED nunca se auditó, y resulta ser más grande. Esta migración cierra las dos peores
-- de esa familia; el barrido completo (104 helpers `_*` alcanzables por authenticated) es un arco aparte.

-- ---------------------------------------------------------------------------------------------------
-- 1) #1 CRITICAL · _vault_upsert(text,text) — escribible por CUALQUIER usuario autenticado.
--    La migr 315 línea 161 hace `revoke ... from public, anon` y OMITE authenticated. En el Vault viven
--    las secret keys de Stripe de todos los tenants: cualquier cuenta logueada (un empleado, un candidato,
--    la cuenta demo pública) podía sobrescribir la clave de cualquier tenant y desviarse el cobro.
--
--    ⚠️ EL GUARD NO PUEDE SER is_superadmin(), como pedía el plan. Su único llamador legítimo es
--    save_stripe_credentials, que se autoriza con `is_ceo_or_above()` — un CEO guardando SUS credenciales
--    de Stripe es el caso de uso normal. Un guard de superadmin habría roto el alta de Stripe de todos los
--    tenants. El guard correcto distingue "me llaman desde dentro de un wrapper DEFINER" de "me llaman
--    directo por REST": dentro de un DEFINER propiedad de postgres, current_user ES postgres; desde
--    PostgREST con sesión, current_user es 'authenticated'.
create or replace function public._vault_upsert(_name text, _secret text)
returns void language plpgsql security definer set search_path to 'public','vault','extensions' as $$
declare _id uuid;
begin
  if current_user not in ('postgres','service_role') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select id into _id from vault.secrets where name = _name limit 1;
  if _id is not null then perform vault.update_secret(_id, _secret, _name);
  else perform vault.create_secret(_secret, _name); end if;
end $$;
revoke execute on function public._vault_upsert(text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------
-- 2) #5 CRITICAL · _send_security_email(text,text,text) — open relay autenticado.
--    Acepta destinatario, asunto y cuerpo HTML arbitrarios y era ejecutable por authenticated: cualquier
--    usuario logueado podía mandar correo con HTML a cualquier dirección desde el dominio verificado de la
--    plataforma. Eso es phishing con la reputación del dominio y quema la entregabilidad de TODOS los
--    tenants. Mismo razonamiento para el guard: su llamador es _email_superadmins (DEFINER), y las alertas
--    de seguridad las dispara un cron que corre como postgres — un guard is_superadmin() habría apagado
--    en silencio todo el alertado de seguridad de S4, porque en un cron no hay JWT que inspeccionar.
create or replace function public._send_security_email(p_to text, p_subject text, p_body_html text)
returns void language plpgsql security definer set search_path to 'public','extensions' as $$
declare _key text;
begin
  if current_user not in ('postgres','service_role') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if coalesce(p_to,'')='' then return; end if;
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _key is null then return; end if;   -- gap documentado: sin RESEND_API_KEY no hay email
  begin
    perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
    perform http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],
      'application/json', jsonb_build_object('from','NÚCLEO Security <noreply@raisen.agency>','to',p_to,
        'subject',left(p_subject,200),'html',p_body_html)::text)::http_request);
  exception when others then
    -- Antes: `then null`. Un fallo de envío de una ALERTA DE SEGURIDAD desaparecía sin rastro.
    insert into public.audit_log(tenant_id, action, entity_type, new_values, risk_level)
      values(null, 'security_email_failed', 'security',
             jsonb_build_object('to', p_to, 'sqlstate', sqlstate, 'error', sqlerrm), 'high');
  end;
end $$;
revoke execute on function public._send_security_email(text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------
-- 3) #8 CRITICAL · search_path malformado → emails que NUNCA se enviaron.
--    `SET search_path TO 'public, extensions'` (UNA cadena con coma dentro) declara UN esquema llamado
--    literalmente «public, extensions», que no existe. Las llamadas sin cualificar —http(), http_header(),
--    http_set_curlopt(), el tipo http_request— no resuelven y revientan con 42883. La forma correcta son
--    DOS elementos: 'public','extensions'.
--    Barrido completo del catálogo: son exactamente 2 funciones, no más.
--      · _send_screening_email  (trigger)  → el correo al candidato nunca salió; `exception ... then null`
--      · _send_appointment_email           → el correo de cita nunca salió; sólo dejaba un raise warning
--                                            en el log de Postgres, invisible desde la aplicación
--    ⚠️ Esto ENCIENDE dos flujos de correo que llevaban tiempo apagados. Es el arreglo buscado, pero
--    conviene saberlo: a partir de aquí los candidatos y los clientes con cita reciben su email de verdad.

create or replace function public._send_screening_email()
returns trigger language plpgsql security definer set search_path to 'public','extensions' as $$
declare _key text; _host text; _name text; _title text; _link text; _html text;
begin
  select allowed_origins->>0, coalesce(display_name, legal_name) into _host, _name from public.tenants where id = new.tenant_id;
  if _host is null or _host = '' then return new; end if;
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then return new; end if;
  select jp.title into _title from public.job_openings o join public.job_positions jp on jp.id = o.position_id where o.id = new.opening_id;
  _link := 'https://' || _host || '/screening/' || new.id::text;
  _html := '<p>Gracias por aplicar a <b>' || coalesce(_title, 'la vacante') || '</b> en ' || coalesce(_name, '') ||
    '.</p><p>Para continuar tu proceso, completa tus documentos y exámenes:</p><p><a href="' || _link || '">' || _link || '</a></p>';
  begin
    perform http(('POST', 'https://api.resend.com/emails', array[http_header('Authorization', 'Bearer ' || _key)],
      'application/json', jsonb_build_object('from', coalesce(_name, 'Reclutamiento') || ' <noreply@raisen.agency>',
        'to', new.email, 'subject', 'Continúa tu aplicación — ' || coalesce(_title, ''), 'html', _html)::text)::http_request);
  exception when others then
    insert into public.audit_log(tenant_id, action, entity_type, entity_id, new_values, risk_level)
      values(new.tenant_id, 'screening_email_failed', 'applicant', new.id,
             jsonb_build_object('to', new.email, 'sqlstate', sqlstate, 'error', sqlerrm), 'medium');
  end;
  return new;
end $$;
revoke execute on function public._send_screening_email() from public, anon;

create or replace function public._send_appointment_email(p_id uuid, p_kind text, p_prev timestamptz default null)
returns void language plpgsql security definer set search_path to 'public','extensions' as $$
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
    insert into public.audit_log(tenant_id, action, entity_type, entity_id, new_values, risk_level)
      values(nullif(_ctx->>'tenant_id','')::uuid, 'appointment_email_failed', 'appointment', p_id,
             jsonb_build_object('kind', p_kind, 'status', _status, 'body', left(coalesce(_resp,''),500)), 'medium');
    raise warning '_send_appointment_email non-2xx status=% body=% apt=%', _status, _resp, p_id; return; end if;
  update public.appointments set
    confirmation_email_sent_at = case when p_kind='confirmation' then now() else confirmation_email_sent_at end,
    reminder_email_sent_at = case when p_kind='reminder' then now() else reminder_email_sent_at end,
    reschedule_email_sent_at = case when p_kind='reschedule' then now() else reschedule_email_sent_at end
  where id = p_id;
exception when others then
  insert into public.audit_log(tenant_id, action, entity_type, entity_id, new_values, risk_level)
    values(null, 'appointment_email_failed', 'appointment', p_id,
           jsonb_build_object('kind', p_kind, 'sqlstate', sqlstate, 'error', sqlerrm), 'medium');
  raise warning '_send_appointment_email EXCEPTION sqlstate=% msg=% apt=%', sqlstate, sqlerrm, p_id;
end $$;
revoke execute on function public._send_appointment_email(uuid, text, timestamptz) from public, anon;

-- ---------------------------------------------------------------------------------------------------
-- 4) #2 CRITICAL · la idempotencia del webhook de Stripe no podía funcionar.
--    stripe_webhook_events.id es text PRIMARY KEY NOT NULL SIN default, y la Edge Function nunca lo
--    enviaba → todo INSERT fallaba con 23502 (not_null_violation). El código sólo comprobaba 23505, así
--    que el fallo se descartaba en silencio: por eso la tabla tiene 0 filas desde el día que se creó.
--    Además el comentario del código dice "unique stripe_event_id" y ESA RESTRICCIÓN NO EXISTÍA.
--    Aquí se crea, para que la idempotencia sea una garantía del motor y no una convención del cliente.
create unique index if not exists uq_stripe_webhook_events_event_id
  on public.stripe_webhook_events (stripe_event_id) where stripe_event_id is not null;

-- ---------------------------------------------------------------------------------------------------
insert into public.audit_log (tenant_id, action, entity_type, new_values, risk_level)
values (null, 'side5_hotfix_applied', 'security',
  jsonb_build_object(
    'vault_upsert', 'revoke authenticated + guard current_user',
    'security_email', 'revoke authenticated + guard current_user + audit en excepcion',
    'search_path_fixed', jsonb_build_array('_send_screening_email','_send_appointment_email'),
    'idempotency', 'unique index sobre stripe_event_id',
    'guard_note', 'is_superadmin() habria roto save_stripe_credentials (CEO) y las alertas por cron',
    'migration', '20260808000353'),
  'critical');
