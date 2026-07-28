-- ============================================================================
-- SEGURIDAD S4+S5 · Email alerts (Resend) + HERMES checkpoint + MFA events + notif
--   Sobre S1-S6. Email vía extensión `http` (pgsql-http) + vault `resend_api_key`
--   (mismo patrón que _send_screening_email/_marketing_email_lead; NO hay pg_net).
-- GOTCHA grants ([[anon-execute-fail-secure]]): todo interno o superadmin → sin anon.
-- ============================================================================

-- Ampliar event_type con MFA + HERMES.
alter table public.guardian_events drop constraint if exists guardian_events_event_type_check;
alter table public.guardian_events add constraint guardian_events_event_type_check check (
  event_type = any(array['login_success','login_failed','logout','password_reset','password_change',
    'new_device','new_ip','brute_force_detected','rate_limit_exceeded','suspicious_activity',
    'rls_violation_attempt','role_change','permission_change','sensitive_data_access','export_data',
    'account_locked','account_unlocked','rls_audit_failed','integrity_check_failed','orphan_detected','security_summary',
    'mfa_enrolled','mfa_disabled','mfa_challenge_failed','hermes_drift']));

-- ── PARTE 1a · Email de seguridad (Resend vía http) ─────────────────────────
create or replace function public._send_security_email(p_to text, p_subject text, p_body_html text)
 returns void language plpgsql security definer set search_path to 'public','extensions'
as $fn$
declare _key text;
begin
  if coalesce(p_to,'')='' then return; end if;
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _key is null then return; end if;   -- gap documentado: sin RESEND_API_KEY no hay email
  begin
    perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
    perform http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],
      'application/json', jsonb_build_object('from','NÚCLEO Security <noreply@raisen.agency>','to',p_to,
        'subject',left(p_subject,200),'html',p_body_html)::text)::http_request);
  exception when others then null;  -- best-effort: nunca romper la transacción por el email
  end;
end $fn$;

create or replace function public._email_superadmins(p_subject text, p_body_html text)
 returns void language plpgsql security definer set search_path to 'public','extensions'
as $fn$
declare r record;
begin
  for r in select distinct p.email from public.profiles p join public.user_roles ur on ur.user_id=p.id
      where ur.role='superadmin' and coalesce(p.email,'')<>'' loop
    perform public._send_security_email(r.email, p_subject, p_body_html);
  end loop;
end $fn$;

-- ── PARTE 1b · Trigger: email al superadmin en eventos critical ─────────────
create or replace function public._email_on_critical_event()
 returns trigger language plpgsql security definer set search_path to 'public','extensions'
as $fn$
declare _html text;
begin
  -- throttle: 1 email por (event_type, ip) cada 15 min → evita tormenta en fuerza bruta
  if exists (select 1 from public.guardian_events where event_type=new.event_type and severity='critical'
      and coalesce(ip_address,'')=coalesce(new.ip_address,'') and created_at > now()-interval '15 minutes' and id<>new.id) then
    return new;
  end if;
  _html := '<h2 style="color:#c0392b">🔴 ALERTA CRÍTICA DE SEGURIDAD</h2>'||
    '<p><b>Evento:</b> '||coalesce(new.event_type,'—')||'</p>'||
    '<p><b>IP:</b> '||coalesce(new.ip_address,'—')||'</p>'||
    '<p><b>Usuario:</b> '||coalesce(new.user_id::text,'—')||'</p>'||
    '<p><b>Cuándo:</b> '||to_char(new.created_at,'YYYY-MM-DD HH24:MI')||' UTC</p>'||
    '<p><b>Detalle:</b> '||coalesce(public._html_escape(new.metadata::text),'—')||'</p>'||
    '<p><a href="https://nucleoraisen.com/security">Ver en el panel de seguridad →</a></p>';
  perform public._email_superadmins('🔴 ALERTA CRÍTICA — '||coalesce(new.event_type,'evento'), _html);
  return new;
end $fn$;

drop trigger if exists trg_email_critical on public.guardian_events;
create trigger trg_email_critical after insert on public.guardian_events
  for each row when (new.severity='critical') execute function public._email_on_critical_event();

-- ── PARTE 1c · Email del resumen diario (reemplaza sentinel_daily_summary) ───
create or replace function public.sentinel_daily_summary()
 returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $fn$
declare _res jsonb; _notable boolean;
  _logins int; _failed int; _brute int; _newip int; _newdev int; _blocked int; _highrisk int; _unresolved int;
begin
  select count(*) filter (where event_type='login_success'), count(*) filter (where event_type='login_failed'),
         count(*) filter (where event_type='brute_force_detected'), count(*) filter (where event_type='new_ip'),
         count(*) filter (where event_type='new_device')
    into _logins,_failed,_brute,_newip,_newdev
    from public.guardian_events where created_at > now()-interval '24 hours';
  select count(*) into _blocked from public.ip_watchlist where list_type='block' and (expires_at is null or expires_at>now());
  select count(*) into _highrisk from public.audit_log where created_at > now()-interval '24 hours' and risk_level in ('high','critical');
  select count(*) into _unresolved from public.guardian_events where not resolved and severity in ('high','critical');
  _res := jsonb_build_object('window','24h','logins',_logins,'failed_logins',_failed,'brute_force',_brute,
    'new_ips',_newip,'new_devices',_newdev,'blocked_ips',_blocked,'high_risk_actions',_highrisk,'unresolved_events',_unresolved);
  _notable := (_failed>0 or _brute>0 or _blocked>0 or _highrisk>0 or _unresolved>0);
  insert into public.sentinel_scans(scan_type,score,passed,results,issues_count)
    values('daily_summary', null, not _notable, _res, _unresolved);
  if _notable then
    insert into public.notifications(tenant_id, user_id, kind, title, body, entity_type, entity_id)
      select ur.tenant_id, ur.user_id, 'security', 'Resumen de seguridad (24h)',
        _failed||' logins fallidos · '||_brute||' fuerza bruta · '||_blocked||' IPs bloqueadas · '||_unresolved||' eventos sin resolver', 'sentinel', null
      from public.user_roles ur where ur.role='superadmin'
        and not exists (select 1 from public.notifications n where n.user_id=ur.user_id and n.kind='security'
          and n.title='Resumen de seguridad (24h)' and n.created_at::date=now()::date);
    perform public._email_superadmins('🛡️ Resumen de seguridad diario — '||to_char(now(),'YYYY-MM-DD'),
      '<h2>🛡️ Resumen de seguridad (últimas 24h)</h2><ul>'||
      '<li>Logins exitosos: '||_logins||'</li><li>Logins fallidos: '||_failed||'</li>'||
      '<li>Fuerza bruta: '||_brute||'</li><li>IPs/dispositivos nuevos: '||_newip||'/'||_newdev||'</li>'||
      '<li>IPs bloqueadas: '||_blocked||'</li><li>Acciones de alto riesgo: '||_highrisk||'</li>'||
      '<li>Eventos sin resolver: '||_unresolved||'</li></ul>'||
      '<p><a href="https://nucleoraisen.com/security">Abrir panel de seguridad →</a></p>');
  end if;
  return _res;
end $fn$;

-- ── PARTE 2a · Tabla HERMES ─────────────────────────────────────────────────
create table if not exists public.hermes_checkpoints (
  id uuid primary key default gen_random_uuid(),
  checkpoint_type text not null check (checkpoint_type in ('weekly','manual','pre_deploy','post_deploy')),
  table_count integer, function_count integer, trigger_count integer, cron_count integer,
  migration_count integer, bucket_count integer, rls_policy_count integer,
  tenant_snapshots jsonb, schema_hash text, changes_detected jsonb,
  notes text, created_by uuid, created_at timestamptz default now()
);
alter table public.hermes_checkpoints enable row level security;
drop policy if exists hermes_superadmin on public.hermes_checkpoints;
create policy hermes_superadmin on public.hermes_checkpoints for all using (is_superadmin());
create index if not exists idx_hermes_checkpoints_time on public.hermes_checkpoints(created_at desc);

-- ── PARTE 2b · RPC: crear checkpoint (superadmin o cron) ────────────────────
create or replace function public.create_hermes_checkpoint(p_type text default 'manual', p_notes text default null)
 returns uuid language plpgsql security definer set search_path to 'public'
as $fn$
declare _id uuid; _prev record; _tables int; _funcs int; _trigs int; _crons int; _migs int; _buckets int; _pols int;
  _hash text; _snaps jsonb; _changes jsonb := '[]'::jsonb;
begin
  -- gate: bloquea usuarios autenticados no-superadmin; el cron (sin JWT) pasa
  if nullif(current_setting('request.jwt.claims', true),'') is not null and public.is_superadmin() is not true then
    raise exception 'No autorizado' using errcode='42501';
  end if;
  if p_type not in ('weekly','manual','pre_deploy','post_deploy') then p_type := 'manual'; end if;
  select count(*) into _tables from information_schema.tables where table_schema='public' and table_type='BASE TABLE';
  select count(*) into _funcs from pg_proc where pronamespace='public'::regnamespace;
  select count(*) into _trigs from pg_trigger t join pg_class c on c.oid=t.tgrelid where c.relnamespace='public'::regnamespace and not t.tgisinternal;
  select count(*) into _crons from cron.job;
  select count(*) into _migs from supabase_migrations.schema_migrations;
  select count(*) into _buckets from storage.buckets;
  select count(*) into _pols from pg_policies where schemaname='public';
  select md5(string_agg(table_name||'.'||column_name||':'||data_type, ',' order by table_name, ordinal_position))
    into _hash from information_schema.columns where table_schema='public';
  select jsonb_agg(jsonb_build_object('tenant_id', t.id, 'name', coalesce(t.display_name,t.legal_name,t.slug),
      'invoices', (select count(*) from public.invoices where tenant_id=t.id),
      'customers', (select count(*) from public.customer_profiles where tenant_id=t.id),
      'inventory_items', (select count(*) from public.inventory_items where tenant_id=t.id),
      'journal_entries', (select count(*) from public.journal_entries where tenant_id=t.id)))
    into _snaps from public.tenants t;
  select * into _prev from public.hermes_checkpoints order by created_at desc limit 1;
  if _prev.id is not null then
    if _prev.table_count    is distinct from _tables  then _changes := _changes || jsonb_build_object('metric','tables','from',_prev.table_count,'to',_tables); end if;
    if _prev.function_count is distinct from _funcs   then _changes := _changes || jsonb_build_object('metric','functions','from',_prev.function_count,'to',_funcs); end if;
    if _prev.trigger_count  is distinct from _trigs   then _changes := _changes || jsonb_build_object('metric','triggers','from',_prev.trigger_count,'to',_trigs); end if;
    if _prev.cron_count     is distinct from _crons   then _changes := _changes || jsonb_build_object('metric','crons','from',_prev.cron_count,'to',_crons); end if;
    if _prev.migration_count is distinct from _migs   then _changes := _changes || jsonb_build_object('metric','migrations','from',_prev.migration_count,'to',_migs); end if;
    if _prev.rls_policy_count is distinct from _pols  then _changes := _changes || jsonb_build_object('metric','rls_policies','from',_prev.rls_policy_count,'to',_pols); end if;
    if _prev.schema_hash    is distinct from _hash    then _changes := _changes || jsonb_build_object('metric','schema_hash','from',_prev.schema_hash,'to',_hash); end if;
  end if;
  insert into public.hermes_checkpoints(checkpoint_type, table_count, function_count, trigger_count, cron_count,
      migration_count, bucket_count, rls_policy_count, tenant_snapshots, schema_hash, changes_detected, notes, created_by)
    values(p_type, _tables, _funcs, _trigs, _crons, _migs, _buckets, _pols, _snaps, _hash, _changes, p_notes, auth.uid())
    returning id into _id;
  if jsonb_array_length(_changes) > 0 and _prev.id is not null then
    insert into public.guardian_events(event_type, severity, metadata)
      values('hermes_drift','warning', jsonb_build_object('summary','HERMES detectó '||jsonb_array_length(_changes)||' cambios de estado','changes',_changes));
    perform public._email_superadmins('🛰️ HERMES — cambios de estado detectados',
      '<h2>🛰️ HERMES checkpoint</h2><p>'||jsonb_array_length(_changes)||' cambios respecto al checkpoint anterior:</p><pre>'||public._html_escape(_changes::text)||'</pre>');
  end if;
  return _id;
end $fn$;

-- ── PARTE 3d · Log de eventos MFA (authenticated) ───────────────────────────
create or replace function public.log_mfa_event(p_type text)
 returns void language plpgsql security definer set search_path to 'public'
as $fn$
declare _uid uuid := auth.uid();
begin
  if _uid is null then return; end if;
  if p_type not in ('mfa_enrolled','mfa_disabled','mfa_challenge_failed') then return; end if;
  insert into public.guardian_events(tenant_id, user_id, event_type, severity, metadata)
    values((select tenant_id from public.profiles where id=_uid), _uid, p_type,
      case when p_type='mfa_enrolled' then 'info' else 'warning' end, '{}'::jsonb);
end $fn$;

-- ── Grants explícitos ───────────────────────────────────────────────────────
revoke execute on function public._send_security_email(text,text,text) from public, anon;
revoke execute on function public._email_superadmins(text,text) from public, anon;
revoke execute on function public._email_on_critical_event() from public, anon;
revoke execute on function public.create_hermes_checkpoint(text,text) from public, anon;
grant  execute on function public.create_hermes_checkpoint(text,text) to authenticated;
revoke execute on function public.log_mfa_event(text) from public, anon;
grant  execute on function public.log_mfa_event(text) to authenticated;

-- ── PARTE 5 · Notificaciones que faltaban ───────────────────────────────────
-- (1 low stock · 2 maintenance · 3 warranty · 4 invoice overdue · 6 evaluación→empleado YA existen)
-- 5. Pago recibido: trigger en invoice_payments → notifica ceo/superadmin (insert directo, sin dedup → cada pago avisa).
create or replace function public._notify_payment_received()
 returns trigger language plpgsql security definer set search_path to 'public'
as $fn$
declare _num text;
begin
  select invoice_number into _num from public.invoices where id=new.invoice_id;
  insert into public.notifications(tenant_id, user_id, kind, title, body, entity_type, entity_id)
    select new.tenant_id, ur.user_id, 'payment_received',
      'Pago recibido: '||coalesce(_num,''),
      '$'||to_char(coalesce(new.amount,0),'FM999999990.00')||' registrado el '||to_char(coalesce(new.payment_date, now())::date,'YYYY-MM-DD'),
      'invoice', new.invoice_id
    from public.user_roles ur where ur.tenant_id=new.tenant_id and ur.role in ('ceo','superadmin');
  return new;
end $fn$;
drop trigger if exists trg_notify_payment_received on public.invoice_payments;
create trigger trg_notify_payment_received after insert on public.invoice_payments
  for each row execute function public._notify_payment_received();

-- 7. Custodia >24h sin check-in: cron diario → activo in_use cuyo último movimiento es checkout hace >24h.
create or replace function public.check_custody_overdue()
 returns void language plpgsql security definer set search_path to 'public'
as $fn$
begin
  insert into public.notifications(tenant_id, user_id, kind, title, body, entity_type, entity_id)
  select a.tenant_id, ur.user_id, 'custody_overdue',
    'Activo fuera >24h: '||coalesce(a.name,''),
    'Sin check-in desde '||to_char(last_mv.custody_at,'YYYY-MM-DD HH24:MI')||' UTC',
    'asset', a.id
  from public.tenant_assets a
  join lateral (select cl.custody_type, cl.custody_at from public.asset_custody_log cl
    where cl.asset_id=a.id order by cl.custody_at desc limit 1) last_mv on true
  join public.user_roles ur on ur.tenant_id=a.tenant_id and ur.role in ('ceo','superadmin')
  where a.status='in_use' and last_mv.custody_type='checkout' and last_mv.custody_at < now()-interval '24 hours'
    and not exists (select 1 from public.notifications n where n.entity_id=a.id and n.kind='custody_overdue' and n.created_at::date=now()::date);
  return;
end $fn$;

-- ── Grants Parte 5 ──────────────────────────────────────────────────────────
revoke execute on function public._notify_payment_received() from public, anon;
revoke execute on function public.check_custody_overdue() from public, anon;

-- ── Crons ───────────────────────────────────────────────────────────────────
select cron.schedule('hermes-checkpoint', '0 6 * * 1', $c$select public.create_hermes_checkpoint('weekly')$c$);
select cron.schedule('check-custody-overdue', '0 14 * * *', $c$select public.check_custody_overdue()$c$);
