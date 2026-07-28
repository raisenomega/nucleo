-- ============================================================================
-- SEGURIDAD S2 · Login security: eventos de login/logout + brute force + IP watchlist
--   + detección de patrones (cron horario) + cleanup (cron semanal)
-- Diseño: docs-nucleo/SEGURIDAD-NUCLEO.md v2.0 §2c. Sobre guardian_events/ip_watchlist (S1).
-- GOTCHA S1: funciones nuevas SON anon-ejecutables por defecto (Supabase las otorga a anon
--   directamente; ALTER DEFAULT PRIVILEGES no lo bloquea de forma fiable). → grants EXPLÍCITOS
--   por función: revoke public+anon en internas, grant anon en las públicas.
-- ============================================================================

-- Helper interno: upsert en ip_watchlist (llamado por log_login_failed, corre como owner).
create or replace function public._watchlist_upsert(_ip text, _type text, _reason text, _exp timestamptz)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
begin
  update public.ip_watchlist set list_type=_type, reason=_reason, expires_at=_exp, hits=hits+1, last_hit_at=now()
    where ip_address=_ip and scope_tenant_id is null;
  if not found then
    insert into public.ip_watchlist(ip_address, list_type, reason, expires_at, hits, last_hit_at)
      values(_ip, _type, _reason, _exp, 1, now());
  end if;
end $function$;

-- ── Login exitoso (authenticated) + detección de IP/dispositivo nuevo ────────
create or replace function public.log_login_success()
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _hdr jsonb; _ip text; _ua text; _uid uuid := auth.uid(); _tenant uuid;
begin
  if _uid is null then return; end if;
  _hdr := nullif(current_setting('request.headers', true), '')::jsonb;
  _ip := _hdr->>'x-forwarded-for'; _ua := _hdr->>'user-agent';
  select tenant_id into _tenant from public.profiles where id=_uid;
  insert into public.guardian_events(tenant_id, user_id, event_type, severity, ip_address, user_agent)
    values(_tenant, _uid, 'login_success', 'info', _ip, _ua);
  if _ip is not null and not exists (select 1 from public.guardian_events where user_id=_uid and event_type='login_success'
      and ip_address=_ip and created_at > now()-interval '30 days' and created_at < now()-interval '2 seconds') then
    insert into public.guardian_events(tenant_id, user_id, event_type, severity, ip_address, user_agent, metadata)
      values(_tenant, _uid, 'new_ip', 'warning', _ip, _ua, jsonb_build_object('summary','Inicio de sesión desde una IP nueva'));
    perform public._notify_user(_tenant, _uid, 'security', 'Nuevo inicio de sesión', 'Detectamos un inicio desde una IP nueva ('||_ip||')', 'guardian_event', null);
  end if;
  if _ua is not null and not exists (select 1 from public.guardian_events where user_id=_uid and event_type='login_success'
      and user_agent=_ua and created_at > now()-interval '30 days' and created_at < now()-interval '2 seconds') then
    insert into public.guardian_events(tenant_id, user_id, event_type, severity, ip_address, user_agent, metadata)
      values(_tenant, _uid, 'new_device', 'warning', _ip, _ua, jsonb_build_object('summary','Inicio de sesión desde un dispositivo nuevo'));
  end if;
end $function$;

-- ── Login fallido (anon) + detección de fuerza bruta ────────────────────────
create or replace function public.log_login_failed(p_email text, p_ip text default null, p_user_agent text default null)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _hdr jsonb; _ip text; _ua text; _uid uuid; _tenant uuid; _fails int; _email text := lower(trim(coalesce(p_email,'')));
begin
  _hdr := nullif(current_setting('request.headers', true), '')::jsonb;
  _ip := coalesce(p_ip, _hdr->>'x-forwarded-for', _hdr->>'cf-connecting-ip');
  _ua := coalesce(p_user_agent, _hdr->>'user-agent');
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
end $function$;

-- ── Verificar IP en watchlist (anon, fail-open) ─────────────────────────────
create or replace function public.check_ip_allowed(p_ip text default null)
 returns boolean language plpgsql security definer set search_path to 'public'
as $function$
declare _ip text;
begin
  _ip := coalesce(p_ip, nullif(current_setting('request.headers', true), '')::jsonb->>'x-forwarded-for');
  if _ip is null then return true; end if;
  if exists (select 1 from public.ip_watchlist where ip_address=_ip and list_type='block' and (expires_at is null or expires_at>now())) then
    return false; end if;
  return true;   -- fail-open: no bloquear usuarios legítimos
end $function$;

-- ── Logout (authenticated) ──────────────────────────────────────────────────
create or replace function public.log_logout()
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _uid uuid := auth.uid(); _hdr jsonb;
begin
  if _uid is null then return; end if;
  _hdr := nullif(current_setting('request.headers', true), '')::jsonb;
  insert into public.guardian_events(tenant_id, user_id, event_type, severity, ip_address, user_agent)
    values((select tenant_id from public.profiles where id=_uid), _uid, 'logout', 'info', _hdr->>'x-forwarded-for', _hdr->>'user-agent');
end $function$;

-- ── Cron horario: patrones sospechosos ──────────────────────────────────────
create or replace function public.check_suspicious_activity()
 returns void language plpgsql security definer set search_path to 'public'
as $function$
begin
  -- Credential stuffing: una IP con login_failed en >3 emails distintos en 1h
  with cs as (
    select ip_address, count(distinct metadata->>'email') n from public.guardian_events
    where event_type='login_failed' and created_at > now()-interval '1 hour' and ip_address is not null
    group by ip_address having count(distinct metadata->>'email') > 3)
  insert into public.guardian_events(user_id, event_type, severity, ip_address, metadata)
  select null, 'suspicious_activity', 'critical', cs.ip_address,
    jsonb_build_object('summary', 'Credential stuffing: '||cs.n||' cuentas desde una IP', 'accounts', cs.n)
  from cs where not exists (select 1 from public.guardian_events g where g.event_type='suspicious_activity'
    and g.ip_address=cs.ip_address and g.created_at > now()-interval '55 minutes');
  -- Impossible travel (sin geo): un usuario con login_success desde >1 IP distinta en 1h
  with tr as (
    select user_id, count(distinct ip_address) n from public.guardian_events
    where event_type='login_success' and created_at > now()-interval '1 hour' and ip_address is not null and user_id is not null
    group by user_id having count(distinct ip_address) > 1)
  insert into public.guardian_events(tenant_id, user_id, event_type, severity, metadata)
  select (select tenant_id from public.profiles p where p.id=tr.user_id), tr.user_id, 'suspicious_activity', 'high',
    jsonb_build_object('summary', 'Logins desde '||tr.n||' IPs distintas en 1h')
  from tr where not exists (select 1 from public.guardian_events g where g.event_type='suspicious_activity'
    and g.user_id=tr.user_id and g.created_at > now()-interval '55 minutes');
  -- Actividad automatizada: un usuario con >20 acciones auditadas en 5 min
  with hot as (
    select user_id, count(*) n from public.audit_log
    where created_at > now()-interval '5 minutes' and user_id is not null group by user_id having count(*) > 20)
  insert into public.guardian_events(user_id, event_type, severity, metadata)
  select hot.user_id, 'suspicious_activity', 'high', jsonb_build_object('summary', hot.n||' acciones en 5 min (posible script)')
  from hot where not exists (select 1 from public.guardian_events g where g.event_type='suspicious_activity'
    and g.user_id=hot.user_id and g.created_at > now()-interval '55 minutes');
end $function$;

-- ── Cron semanal: cleanup de logs ───────────────────────────────────────────
create or replace function public.cleanup_security_logs()
 returns void language plpgsql security definer set search_path to 'public'
as $function$
begin
  delete from public.guardian_events where created_at < now()-interval '90 days';
  delete from public.audit_log where created_at < now()-interval '1 year';
  delete from public.ip_watchlist where expires_at is not null and expires_at < now();
  delete from public.rate_limit_public where window_start < now()-interval '7 days';
end $function$;

-- ── Grants explícitos (gotcha S1: por-función, no confiar en defaults) ───────
revoke execute on function public._watchlist_upsert(text,text,text,timestamptz) from public, anon;
revoke execute on function public.log_login_success() from public, anon;
grant  execute on function public.log_login_success() to authenticated;
revoke execute on function public.log_logout() from public, anon;
grant  execute on function public.log_logout() to authenticated;
revoke execute on function public.check_suspicious_activity() from public, anon;
revoke execute on function public.cleanup_security_logs() from public, anon;
grant  execute on function public.log_login_failed(text,text,text) to anon, authenticated;
grant  execute on function public.check_ip_allowed(text) to anon, authenticated;

-- ── Crons ───────────────────────────────────────────────────────────────────
select cron.schedule('check-suspicious-activity', '0 * * * *', $cron$select public.check_suspicious_activity()$cron$);
select cron.schedule('cleanup-security-logs', '0 3 * * 0', $cron$select public.cleanup_security_logs()$cron$);
