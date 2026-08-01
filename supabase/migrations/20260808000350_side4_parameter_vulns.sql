-- SIDE-4 · Vulnerabilidades de DISEÑO DE PARÁMETRO en funciones anon legítimas.
-- El grant a anon es correcto en todas: el fallo es que aceptan como parámetro un dato que el propio
-- servidor debería derivar (la IP), o que limitan por un dato que el atacante controla (el email).
-- Base: definiciones traídas de prod con pg_get_functiondef, no de copias del repo.

-- ---------------------------------------------------------------------------------------------------
-- 0) Gate de rate limit por IP REAL. _public_rate_hit ya existía pero tiene la ventana fija en 5 min;
--    aquí hace falta también 1 hora. Misma tabla (rate_limit_public), misma idea de ventana en la llave.
--    Interna: se revoca de public/anon explícitamente (se llama desde funciones DEFINER, no por REST).
-- ---------------------------------------------------------------------------------------------------
create or replace function public._rate_hit_ip(_key text, _window_secs int)
returns int language plpgsql security definer set search_path to 'public','extensions' as $$
declare _ip text; _bucket text; _cnt int;
begin
  _ip := coalesce(nullif(current_setting('request.headers', true),'')::jsonb->>'x-forwarded-for', 'unknown');
  _bucket := encode(digest(_key || '|' || _ip || '|'
    || (floor(extract(epoch from now())/_window_secs)*_window_secs)::text, 'sha256'),'hex');
  delete from public.rate_limit_public where window_start < now() - interval '24 hours';
  insert into public.rate_limit_public(bucket_key, count, window_start) values (_bucket, 1, now())
  on conflict (bucket_key) do update set count = rate_limit_public.count + 1
  returning count into _cnt;
  return _cnt;
end $$;
revoke execute on function public._rate_hit_ip(text, int) from public, anon;

-- Normaliza un email a su base: quita el sub-alias +n, que es la evasión clásica de un rate limit por email.
-- OJO con el orden: hay que cortar por '@' ANTES que por '+', o un email sin alias sale duplicado.
create or replace function public._email_base(_e text)
returns text language sql immutable set search_path to 'public' as $$
  select split_part(split_part(lower(trim(coalesce(_e,''))),'@',1),'+',1)
      || '@' || split_part(lower(trim(coalesce(_e,''))),'@',2);
$$;
revoke execute on function public._email_base(text) from public, anon;

-- ---------------------------------------------------------------------------------------------------
-- 1) log_login_failed — LA CRÍTICA. p_ip tenía precedencia sobre las cabeceras
--    (`_ip := coalesce(p_ip, _hdr->>'x-forwarded-for', ...)`), así que un anónimo elegía la IP víctima
--    y con 10 llamadas la metía en la watchlist con list_type='block' durante 24h. Bloqueo de la IP de
--    cualquiera, incluida la del owner, sin auth y sin token.
--    El parámetro se ELIMINA, no se ignora: mientras exista, alguien puede volver a usarlo.
--    No rompe nada: el frontend ya llamaba con un solo argumento (supabase-auth.adapter.ts:32).
-- ---------------------------------------------------------------------------------------------------
drop function if exists public.log_login_failed(text, text, text);

create function public.log_login_failed(p_email text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _hdr jsonb; _ip text; _ua text; _uid uuid; _tenant uuid; _fails int;
  _email text := lower(trim(coalesce(p_email,'')));
begin
  _hdr := nullif(current_setting('request.headers', true), '')::jsonb;
  _ip := coalesce(_hdr->>'x-forwarded-for', _hdr->>'cf-connecting-ip');   -- SOLO cabeceras: no negociable
  _ua := _hdr->>'user-agent';
  select id into _uid from auth.users where lower(email)=_email;
  if _uid is not null then select tenant_id into _tenant from public.profiles where id=_uid; end if;
  insert into public.guardian_events(tenant_id, user_id, event_type, severity, ip_address, user_agent, metadata)
    values(_tenant, _uid, 'login_failed', 'warning', _ip, _ua, jsonb_build_object('email', _email));
  select count(*) into _fails from public.guardian_events
    where event_type='login_failed' and created_at > now()-interval '15 minutes'
      and (metadata->>'email'=_email or (_ip is not null and ip_address=_ip));
  if _fails >= 3 then
    insert into public.guardian_events(tenant_id, user_id, event_type, severity, ip_address, user_agent, metadata)
      values(_tenant, _uid, 'brute_force_detected', 'critical', _ip, _ua,
        jsonb_build_object('email', _email, 'fails', _fails, 'summary', 'Posible fuerza bruta en '||_email));
    if _tenant is not null then perform public._notify_user(_tenant,
      (select user_id from public.user_roles where tenant_id=_tenant and role in ('ceo','superadmin') order by role limit 1),
      'security', 'Posible fuerza bruta', _fails||' intentos fallidos en '||_email, 'guardian_event', null); end if;
  end if;
  if _fails >= 5 and _ip is not null then perform public._watchlist_upsert(_ip, 'watch', 'brute force '||_email, now()+interval '1 hour'); end if;
  if _fails >= 10 and _ip is not null then perform public._watchlist_upsert(_ip, 'block', 'brute force block '||_email, now()+interval '24 hours'); end if;
  return jsonb_build_object('blocked', _fails >= 10, 'reason', case when _fails >= 10 then 'too_many_attempts' else null end);
end $$;
grant execute on function public.log_login_failed(text) to anon, authenticated;

-- ---------------------------------------------------------------------------------------------------
-- 2) check_ip_allowed — mismo patrón: p_ip permitía consultar la blocklist de CUALQUIER IP (oráculo).
--    Se elimina el parámetro; ya sólo puede preguntar por la suya. El retorno ya era un boolean pelado
--    sin motivo ni timestamp, así que no había más detalle que quitar.
--    No rompe nada: el frontend ya llamaba sin argumentos (supabase-auth.adapter.ts:20).
-- ---------------------------------------------------------------------------------------------------
drop function if exists public.check_ip_allowed(text);

create function public.check_ip_allowed()
returns boolean language plpgsql security definer set search_path to 'public' as $$
declare _ip text;
begin
  _ip := nullif(current_setting('request.headers', true), '')::jsonb->>'x-forwarded-for';
  if _ip is null then return true; end if;
  if exists (select 1 from public.ip_watchlist where ip_address=_ip and list_type='block'
             and (expires_at is null or expires_at>now())) then return false; end if;
  return true;   -- fail-open: no bloquear usuarios legítimos
end $$;
grant execute on function public.check_ip_allowed() to anon, authenticated;

-- ---------------------------------------------------------------------------------------------------
-- 3) apply_to_opening — no tenía NINGÚN límite. Con p_email arbitrario en bucle se convierte en un
--    cañón de email bombing contra una víctima (cada alta dispara el correo de screening).
--    Se añade límite por IP real: 3 por hora. El resto de la función queda idéntica.
-- ---------------------------------------------------------------------------------------------------
create or replace function public.apply_to_opening(p_opening_id uuid, p_full_name text, p_email text,
  p_phone text default null, p_address text default null, p_city text default null, p_state text default null,
  p_zip_code text default null, p_cover_letter text default null, p_custom_answers jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _id uuid; _tenant uuid; _status text; _closes timestamptz;
begin
  if public._rate_hit_ip('apply_to_opening', 3600) > 3 then
    insert into public.audit_log(tenant_id, action, entity_type, new_values, risk_level)
      values(null, 'rate_limit_exceeded', 'security',
             jsonb_build_object('fn','apply_to_opening','opening_id',p_opening_id), 'medium');
    raise exception 'Demasiadas solicitudes desde esta conexión. Intenta más tarde.';
  end if;
  select tenant_id, status, closes_at into _tenant, _status, _closes
    from public.job_openings where id = p_opening_id;
  if _tenant is null then raise exception 'Vacante no encontrada'; end if;
  if _status <> 'published' then raise exception 'La vacante no está abierta'; end if;
  if _closes is not null and _closes <= now() then raise exception 'La vacante ya cerró'; end if;
  if trim(coalesce(p_full_name,'')) = '' or trim(coalesce(p_email,'')) = '' then
    raise exception 'Nombre y email son obligatorios'; end if;
  if exists (select 1 from public.applicants where opening_id = p_opening_id and lower(email) = lower(p_email)) then
    raise exception 'Ya aplicaste a esta vacante con este email'; end if;
  insert into public.applicants(tenant_id, opening_id, full_name, email, phone, address, city, state,
    zip_code, cover_letter, custom_answers, stage, source)
  values (_tenant, p_opening_id, trim(p_full_name), lower(trim(p_email)), p_phone, p_address, p_city,
    p_state, p_zip_code, p_cover_letter, coalesce(p_custom_answers,'{}'::jsonb), 'applied', 'portal')
  returning id into _id;
  return _id;
end $$;

-- ---------------------------------------------------------------------------------------------------
-- 4) get_applicant_screening_status — se le pone freno de enumeración (60/h por IP). NO se cambia a
--    INVOKER ni se le exige token: ver la nota del final, ambas cosas rompen el flujo del candidato.
-- ---------------------------------------------------------------------------------------------------
create or replace function public.get_applicant_screening_status(p_applicant_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare a record; pos record; _reqdocs jsonb; _exams jsonb; _docs_ok bool;
begin
  if public._rate_hit_ip('screening_status', 3600) > 60 then
    return jsonb_build_object('error', 'rate_limited'); end if;
  select * into a from public.applicants where id = p_applicant_id;
  if a.id is null then return jsonb_build_object('error', 'not_found'); end if;
  select jp.title, jp.required_documents, jp.required_exam_ids into pos
    from public.job_openings o join public.job_positions jp on jp.id = o.position_id where o.id = a.opening_id;
  _reqdocs := coalesce(pos.required_documents, '[]'::jsonb);
  _docs_ok := not exists (select 1 from jsonb_array_elements_text(_reqdocs) rd
    where not exists (select 1 from jsonb_array_elements(coalesce(a.documents_uploaded, '[]'::jsonb)) du
                      where du->>'name' = rd and (du->>'verified')::boolean is true));
  select coalesce(jsonb_agg(jsonb_build_object('exam_id', re.id, 'title', re.title, 'max_attempts', re.max_attempts,
    'attempts_used', (select count(*) from public.exam_attempts ea where ea.applicant_id = a.id and ea.exam_id = re.id),
    'status', case when exists (select 1 from public.exam_attempts ea where ea.applicant_id = a.id and ea.exam_id = re.id and ea.passed = true) then 'passed'
      when (select count(*) from public.exam_attempts ea where ea.applicant_id = a.id and ea.exam_id = re.id) >= re.max_attempts then 'failed' else 'pending' end,
    'score', (select max(score) from public.exam_attempts ea where ea.applicant_id = a.id and ea.exam_id = re.id))), '[]'::jsonb) into _exams
  from unnest(coalesce(pos.required_exam_ids, '{}')) as ex(exam_id) join public.recruitment_exams re on re.id = ex.exam_id;
  return jsonb_build_object('applicant_name', a.full_name, 'position_title', pos.title, 'stage', a.stage,
    'documents', jsonb_build_object('required', _reqdocs, 'uploaded', coalesce(a.documents_uploaded, '[]'::jsonb), 'complete', _docs_ok),
    'exams', _exams, 'auto_rejected', a.stage = 'rejected');
end $$;

-- ---------------------------------------------------------------------------------------------------
-- 5) upload_applicant_document — no validaba NADA de la URL: un anónimo con el uuid del candidato podía
--    colgarle en el expediente un enlace externo (p.ej. malware) que luego abre RRHH.
--    p_document_url NO es una URL: es la RUTA de storage que devuelve get_applicant_upload_path, con
--    formato «{tenant_id}/{applicant_id}/{8 hex}-{nombre}». Se valida contra ESE formato y contra ESE
--    candidato — un regex de https:// habría rechazado todas las subidas legítimas.
-- ---------------------------------------------------------------------------------------------------
create or replace function public.upload_applicant_document(p_applicant_id uuid, p_document_name text, p_document_url text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare _tenant uuid;
begin
  select tenant_id into _tenant from public.applicants where id = p_applicant_id;
  if _tenant is null then raise exception 'Candidato no encontrado'; end if;
  if coalesce(p_document_url,'') !~ ('^' || _tenant::text || '/' || p_applicant_id::text || '/[0-9a-f]{8}-[A-Za-z0-9._-]+$') then
    raise exception 'Ruta de documento inválida';
  end if;
  update public.applicants set documents_uploaded = coalesce(documents_uploaded,'[]'::jsonb) ||
    jsonb_build_object('name', p_document_name, 'url', p_document_url,
      'uploaded_at', now(), 'verified', false), updated_at = now()
  where id = p_applicant_id;
end $$;

-- ---------------------------------------------------------------------------------------------------
-- 6) _marketing_create_lead — limitaba por email EXACTO, así que victima+1@, victima+2@… lo evadían.
--    Ahora limita por email BASE y además por IP real.
-- ---------------------------------------------------------------------------------------------------
create or replace function public._marketing_create_lead(_payload jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _name text; _email text; _type text; _lang text; _recent int; _lead uuid;
begin
  _name := trim(coalesce(_payload->>'customer_name','')); _email := lower(trim(coalesce(_payload->>'customer_email','')));
  _type := coalesce(_payload->>'lead_type','business'); _lang := case when _payload->>'lang' = 'en' then 'en' else 'es' end;
  if _name = '' or _email = '' then return jsonb_build_object('status','error','code','invalid_payload','message','Nombre y email son requeridos'); end if;
  if _email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then return jsonb_build_object('status','error','code','invalid_email','message','Email inválido'); end if;
  if _type not in ('business','partner') then _type := 'business'; end if;
  if public._rate_hit_ip('mkt_lead', 300) > 3 then
    return jsonb_build_object('status','error','code','rate_limited','message','Demasiados intentos. Intenta más tarde.'); end if;
  select count(*) into _recent from public.marketing_leads
    where public._email_base(customer_email) = public._email_base(_email) and created_at > now() - interval '5 minutes';
  if _recent >= 3 then return jsonb_build_object('status','error','code','rate_limited','message','Demasiados intentos. Intenta más tarde.'); end if;
  insert into public.marketing_leads (lead_type, customer_name, customer_email, customer_phone, company, business_type, message, source_url, utm_source, utm_medium, utm_campaign, lang)
  values (_type, _name, _email, nullif(trim(coalesce(_payload->>'customer_phone','')),''), nullif(trim(coalesce(_payload->>'company','')),''), nullif(trim(coalesce(_payload->>'business_type','')),''),
    nullif(trim(coalesce(_payload->>'message','')),''), _payload->>'source_url', _payload->>'utm_source', _payload->>'utm_medium', _payload->>'utm_campaign', _lang)
  returning id into _lead;
  return jsonb_build_object('status','ok','lead_id',_lead);
end $$;

-- ---------------------------------------------------------------------------------------------------
-- 7) _marketing_create_reservation — no tenía NINGÚN rate limit. Se le añade el mismo par IP + email base.
-- ---------------------------------------------------------------------------------------------------
create or replace function public._marketing_create_reservation(_payload jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _c record; _name text; _email text; _date date; _time time; _lang text; _id uuid; _recent int;
begin
  select * into _c from public.marketing_availability limit 1;
  if _c is null then return jsonb_build_object('status','error','code','no_config','message','No disponible'); end if;
  _name := trim(coalesce(_payload->>'customer_name','')); _email := lower(trim(coalesce(_payload->>'customer_email','')));
  _lang := case when _payload->>'lang' = 'en' then 'en' else 'es' end;
  if _name='' or _email='' then return jsonb_build_object('status','error','code','invalid_payload','message','Nombre y email son requeridos'); end if;
  if _email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then return jsonb_build_object('status','error','code','invalid_email','message','Email inválido'); end if;
  if public._rate_hit_ip('mkt_resv', 3600) > 5 then
    return jsonb_build_object('status','error','code','rate_limited','message','Demasiados intentos. Intenta más tarde.'); end if;
  select count(*) into _recent from public.marketing_reservations
    where public._email_base(customer_email) = public._email_base(_email) and created_at > now() - interval '1 hour';
  if _recent >= 3 then return jsonb_build_object('status','error','code','rate_limited','message','Demasiados intentos. Intenta más tarde.'); end if;
  begin _date := (_payload->>'reservation_date')::date; _time := (_payload->>'reservation_time')::time;
  exception when others then return jsonb_build_object('status','error','code','invalid_slot','message','Fecha u hora inválida'); end;
  if not (public._marketing_available_slots(_date) ? to_char(_time,'HH24:MI')) then
    return jsonb_build_object('status','error','code','slot_taken','message','Ese horario ya no está disponible'); end if;
  insert into public.marketing_reservations (customer_name, customer_email, customer_phone, reservation_date, reservation_time, duration_minutes, notes, lang)
  values (_name, _email, nullif(trim(coalesce(_payload->>'customer_phone','')),''), _date, _time, _c.duration_minutes, nullif(trim(coalesce(_payload->>'message','')),''), _lang)
  returning id into _id;
  return jsonb_build_object('status','ok','reservation_id',_id);
end $$;

-- ---------------------------------------------------------------------------------------------------
-- 8) track_landing_event — su único freno contaba por visitor_id, que lo pone el cliente: basta con
--    rotarlo en cada request para evadirlo. Se añade freno por IP real (300/h). La whitelist de eventos
--    pasa a ser explícita en vez de depender del CHECK de la tabla vía el handler de excepción.
-- ---------------------------------------------------------------------------------------------------
create or replace function public.track_landing_event(_payload jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _host text := lower(trim(coalesce(_payload->>'host','')));
  _tenant uuid; _event text := _payload->>'event_type'; _visitor text := _payload->>'visitor_id'; _recent int;
  _platform uuid := '00000000-0000-0000-0000-0000000000a1';
begin
  if _event is null then return jsonb_build_object('status','skip'); end if;
  if _event not in ('page_view','product_view','service_view','faq_view','blog_view','add_to_cart',
    'remove_from_cart','checkout_started','checkout_completed','form_contact_submitted','form_quote_submitted',
    'form_order_submitted','phone_click','whatsapp_click','email_click','social_click','ai_crawl','ai_referral')
  then return jsonb_build_object('status','skip'); end if;
  if public._rate_hit_ip('track_event', 3600) > 300 then return jsonb_build_object('status','rate_limited'); end if;
  _tenant := public._landing_resolve_tenant(_host);   -- por allowed_origins; null para hosts no-tenant
  if _tenant is null then
    if regexp_replace(_host,'^www\.','') in ('nucleoraisen.com','nucleo-blush.vercel.app','localhost') then _tenant := _platform;
    else return jsonb_build_object('status','skip'); end if;   -- host desconocido → silencioso (no rompe la landing)
  end if;
  if _visitor is not null and _visitor <> '' then
    select count(*) into _recent from public.tenant_landing_analytics where visitor_id=_visitor and created_at > now() - interval '60 seconds';
    if _recent >= 30 then return jsonb_build_object('status','rate_limited'); end if;
  end if;
  begin
    insert into public.tenant_landing_analytics (tenant_id, event_type, path, entity_id, session_id, visitor_id, referrer, user_agent, utm_source, utm_medium, utm_campaign, metadata)
    values (_tenant, _event, _payload->>'path', nullif(_payload->>'entity_id','')::uuid, _payload->>'session_id', _visitor,
      _payload->>'referrer', _payload->>'user_agent', _payload->>'utm_source', _payload->>'utm_medium', _payload->>'utm_campaign', coalesce(_payload->'metadata','{}'::jsonb));
  exception when others then return jsonb_build_object('status','skip'); end;
  return jsonb_build_object('status','ok');
end $$;

-- ---------------------------------------------------------------------------------------------------
-- 9) Los dos revokes que SIDE-2 identificó y la 349 no tocó. Ambos son inertes para anon (register_customer
--    depende de auth.uid(), que es NULL; save_appointment devuelve 'forbidden'), así que quitarles el
--    grant no cambia ningún flujo: los dos llamadores del frontend van con sesión.
-- ---------------------------------------------------------------------------------------------------
revoke execute on function public.register_customer(uuid, text, text) from public, anon;
revoke execute on function public.save_appointment(uuid, jsonb) from public, anon;

-- 10) Traza. tenant_id NULL: evento de plataforma, no de un tenant.
insert into public.audit_log (tenant_id, action, entity_type, new_values, risk_level)
values (null, 'side4_hotfix_applied', 'security',
  jsonb_build_object(
    'functions_fixed', 7, 'functions_revoked', 2, 'helpers_added', 2,
    'critical_fix', 'log_login_failed: p_ip eliminado (DoS de IP arbitraria)',
    'signature_changes', 'log_login_failed(text,text,text)->(text); check_ip_allowed(text)->()',
    'deferred', 'get_applicant_screening_status sigue DEFINER sin token: exigirlo rompe /screening/$applicantId',
    'migration', '20260808000350'),
  'critical');
