-- ============================================================================
-- SEGURIDAD S3+S6 · SENTINEL (crons de integridad/auditoría) + Dashboard /security
--   Diseño: docs-nucleo/SEGURIDAD-NUCLEO.md v2.0 §2b/§5. Sobre S1 (audit_log/
--   guardian_events/ip_watchlist) y S2 (login-guardian).
-- GOTCHA grants ([[anon-execute-fail-secure]]): fn nuevas SON anon por defecto →
--   grants EXPLÍCITOS por función. Todo aquí es interno o superadmin → sin anon.
-- Nota RLS-audit: se flaggea el riesgo REAL (tabla scoped SIN RLS); las tablas con
--   RLS y 0 policies son fail-secure intencionales (definer/service_role) → se
--   reportan como informativas pero NO bajan el score ni disparan critical.
-- ============================================================================

-- Ampliar el CHECK de event_type con los tipos de alerta de SENTINEL.
alter table public.guardian_events drop constraint if exists guardian_events_event_type_check;
alter table public.guardian_events add constraint guardian_events_event_type_check check (
  event_type = any(array['login_success','login_failed','logout','password_reset','password_change',
    'new_device','new_ip','brute_force_detected','rate_limit_exceeded','suspicious_activity',
    'rls_violation_attempt','role_change','permission_change','sensitive_data_access','export_data',
    'account_locked','account_unlocked',
    'rls_audit_failed','integrity_check_failed','orphan_detected','security_summary']));

-- Registro histórico de cada scan de SENTINEL.
create table if not exists public.sentinel_scans (
  id uuid primary key default gen_random_uuid(),
  scan_type text not null check (scan_type in ('rls_audit','gl_integrity','orphan_check','daily_summary')),
  score integer,
  passed boolean not null,
  results jsonb not null,
  issues_count integer default 0,
  scanned_at timestamptz default now()
);
alter table public.sentinel_scans enable row level security;
drop policy if exists sentinel_superadmin on public.sentinel_scans;
create policy sentinel_superadmin on public.sentinel_scans for all using (is_superadmin());
create index if not exists idx_sentinel_scans_type_time on public.sentinel_scans(scan_type, scanned_at desc);

-- Helper: alerta de plataforma → guardian_event (tenant/user null) + notifica a todos los superadmins.
create or replace function public._sentinel_alert(_type text, _severity text, _title text, _body text, _meta jsonb default '{}'::jsonb)
 returns void language plpgsql security definer set search_path to 'public'
as $fn$
begin
  insert into public.guardian_events(tenant_id, user_id, event_type, severity, metadata)
    values(null, null, _type, _severity, _meta || jsonb_build_object('summary', _title));
  insert into public.notifications(tenant_id, user_id, kind, title, body, entity_type, entity_id)
    select ur.tenant_id, ur.user_id, 'security', _title, _body, 'sentinel', null
    from public.user_roles ur where ur.role='superadmin';
end $fn$;

-- ── TAREA 1 · RLS audit (semanal) ───────────────────────────────────────────
create or replace function public.sentinel_rls_audit()
 returns jsonb language plpgsql security definer set search_path to 'public'
as $fn$
declare _checked int; _with_rls int; _missing text[]; _nopol text[]; _score int; _passed boolean; _res jsonb;
begin
  select count(distinct cl.relname) into _checked from pg_class cl join pg_namespace n on n.oid=cl.relnamespace
    where n.nspname='public' and cl.relkind='r'
      and exists (select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=cl.relname and c.column_name in ('tenant_id','user_id'));
  select count(distinct cl.relname) into _with_rls from pg_class cl join pg_namespace n on n.oid=cl.relnamespace
    where n.nspname='public' and cl.relkind='r' and cl.relrowsecurity
      and exists (select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=cl.relname and c.column_name in ('tenant_id','user_id'));
  select coalesce(array_agg(cl.relname order by cl.relname),'{}') into _missing from pg_class cl join pg_namespace n on n.oid=cl.relnamespace
    where n.nspname='public' and cl.relkind='r' and not cl.relrowsecurity
      and exists (select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=cl.relname and c.column_name in ('tenant_id','user_id'));
  select coalesce(array_agg(cl.relname order by cl.relname),'{}') into _nopol from pg_class cl join pg_namespace n on n.oid=cl.relnamespace
    where n.nspname='public' and cl.relkind='r' and cl.relrowsecurity
      and exists (select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=cl.relname and c.column_name in ('tenant_id','user_id'))
      and (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=cl.relname)=0;
  _score := case when _checked=0 then 100 else round(100.0*_with_rls/_checked) end;
  _passed := (array_length(_missing,1) is null);
  _res := jsonb_build_object('tables_checked',_checked,'tables_with_rls',_with_rls,
    'tables_missing_rls',to_jsonb(_missing),'tables_no_policies',to_jsonb(_nopol),'score',_score,'passed',_passed);
  insert into public.sentinel_scans(scan_type,score,passed,results,issues_count)
    values('rls_audit',_score,_passed,_res,coalesce(array_length(_missing,1),0));
  if not _passed then
    perform public._sentinel_alert('rls_audit_failed','critical',
      'RLS Audit falló: '||coalesce(array_length(_missing,1),0)||' tablas scoped sin RLS',
      'Sin RLS: '||array_to_string(_missing,', '),_res);
  end if;
  return _res;
end $fn$;

-- ── TAREA 2 · Integridad GL + Inventario (diario) ───────────────────────────
create or replace function public.sentinel_gl_integrity()
 returns jsonb language plpgsql security definer set search_path to 'public'
as $fn$
declare _tenants int; _issues jsonb := '[]'::jsonb; _gl_ok boolean := true; _inv_ok boolean := true; r record; _res jsonb;
begin
  select count(*) into _tenants from public.tenants where gl_enabled;
  for r in select je.tenant_id, coalesce(sum(jel.debit),0) d, coalesce(sum(jel.credit),0) c
      from public.journal_entries je join public.journal_entry_lines jel on jel.entry_id=je.id
      where je.status='posted' group by je.tenant_id
      having abs(coalesce(sum(jel.debit),0)-coalesce(sum(jel.credit),0)) > 0.01 loop
    _gl_ok := false;
    _issues := _issues || jsonb_build_object('type','gl_unbalanced','tenant_id',r.tenant_id,'debit',r.d,'credit',r.c,'diff',r.d-r.c);
  end loop;
  for r in select ii.id, ii.tenant_id, ii.stock, coalesce(sum(ist.quantity),0) qsum
      from public.inventory_items ii join public.inventory_stock ist on ist.item_id=ii.id
      group by ii.id, ii.tenant_id, ii.stock
      having abs(ii.stock - coalesce(sum(ist.quantity),0)) > 0.001 loop
    _inv_ok := false;
    _issues := _issues || jsonb_build_object('type','stock_mismatch','item_id',r.id,'tenant_id',r.tenant_id,'item_stock',r.stock,'warehouse_sum',r.qsum);
  end loop;
  for r in select ii.id, ii.tenant_id, coalesce(ii.reserved,0) reserved, coalesce(sum(ist.reserved_qty),0) rsum
      from public.inventory_items ii join public.inventory_stock ist on ist.item_id=ii.id
      group by ii.id, ii.tenant_id, ii.reserved
      having abs(coalesce(ii.reserved,0) - coalesce(sum(ist.reserved_qty),0)) > 0.001 loop
    _inv_ok := false;
    _issues := _issues || jsonb_build_object('type','reserved_mismatch','item_id',r.id,'tenant_id',r.tenant_id,'item_reserved',r.reserved,'warehouse_sum',r.rsum);
  end loop;
  _res := jsonb_build_object('tenants_checked',_tenants,'gl_balanced',_gl_ok,'inventory_synced',_inv_ok,'issues',_issues);
  insert into public.sentinel_scans(scan_type,score,passed,results,issues_count)
    values('gl_integrity', case when _gl_ok and _inv_ok then 100 else 0 end, _gl_ok and _inv_ok, _res, jsonb_array_length(_issues));
  if not _gl_ok then perform public._sentinel_alert('integrity_check_failed','critical','GL descuadrado','Uno o más tenants con Débito≠Crédito en asientos posted',_res); end if;
  if not _inv_ok then perform public._sentinel_alert('integrity_check_failed','high','Inventario descuadrado','items.stock/reserved ≠ suma multi-almacén',_res); end if;
  return _res;
end $fn$;

-- ── TAREA 3 · Orphan check (semanal) ────────────────────────────────────────
create or replace function public.sentinel_orphan_check()
 returns jsonb language plpgsql security definer set search_path to 'public'
as $fn$
declare _orphans jsonb := '[]'::jsonb; _n int; _total int := 0; _res jsonb;
begin
  select count(*) into _n from public.invoices i where i.customer_id is not null and not exists (select 1 from public.customer_profiles cp where cp.id=i.customer_id);
  if _n>0 then _orphans := _orphans || jsonb_build_object('relation','invoices.customer_id→customer_profiles','count',_n); _total:=_total+_n; end if;
  select count(*) into _n from public.sales_order_items soi where not exists (select 1 from public.sales_orders so where so.id=soi.sales_order_id);
  if _n>0 then _orphans := _orphans || jsonb_build_object('relation','sales_order_items.sales_order_id→sales_orders','count',_n); _total:=_total+_n; end if;
  select count(*) into _n from public.delivery_note_items dni where not exists (select 1 from public.delivery_notes dn where dn.id=dni.delivery_note_id);
  if _n>0 then _orphans := _orphans || jsonb_build_object('relation','delivery_note_items.delivery_note_id→delivery_notes','count',_n); _total:=_total+_n; end if;
  select count(*) into _n from public.journal_entry_lines jel where not exists (select 1 from public.journal_entries je where je.id=jel.entry_id);
  if _n>0 then _orphans := _orphans || jsonb_build_object('relation','journal_entry_lines.entry_id→journal_entries','count',_n); _total:=_total+_n; end if;
  _res := jsonb_build_object('orphans',_orphans,'total_orphans',_total,'passed',_total=0);
  insert into public.sentinel_scans(scan_type,score,passed,results,issues_count)
    values('orphan_check', case when _total=0 then 100 else greatest(0,100-_total) end, _total=0, _res, _total);
  if _total>0 then perform public._sentinel_alert('orphan_detected','warning','Filas huérfanas detectadas',_total||' filas huérfanas en relaciones críticas',_res); end if;
  return _res;
end $fn$;

-- ── TAREA 4 · Resumen de seguridad diario (7am) ─────────────────────────────
create or replace function public.sentinel_daily_summary()
 returns jsonb language plpgsql security definer set search_path to 'public'
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
  end if;
  return _res;
end $fn$;

-- ── TAREA 7b · Dashboard agregado (superadmin) ──────────────────────────────
create or replace function public.get_security_dashboard()
 returns jsonb language plpgsql security definer set search_path to 'public'
as $fn$
declare _res jsonb;
begin
  if not is_superadmin() then raise exception 'No autorizado' using errcode='42501'; end if;
  select jsonb_build_object(
    'loginsToday', (select count(*) from guardian_events where event_type='login_success' and created_at>now()-interval '24 hours'),
    'failedLoginsToday', (select count(*) from guardian_events where event_type='login_failed' and created_at>now()-interval '24 hours'),
    'bruteForceAttempts', (select count(*) from guardian_events where event_type='brute_force_detected' and created_at>now()-interval '24 hours'),
    'criticalEvents', (select count(*) from guardian_events where severity='critical' and not resolved),
    'blockedIps', (select count(*) from ip_watchlist where list_type='block' and (expires_at is null or expires_at>now())),
    'lastRlsAudit', (select to_jsonb(s) from (select id, scan_type as "scanType", score, passed, issues_count as "issuesCount", scanned_at as "scannedAt" from sentinel_scans where scan_type='rls_audit' order by scanned_at desc limit 1) s),
    'lastGlIntegrity', (select to_jsonb(s) from (select id, scan_type as "scanType", score, passed, issues_count as "issuesCount", scanned_at as "scannedAt" from sentinel_scans where scan_type='gl_integrity' order by scanned_at desc limit 1) s),
    'securityScore', (select coalesce(round(avg(score)),100) from (select score from sentinel_scans where score is not null order by scanned_at desc limit 10) x),
    'recentEvents', (select coalesce(jsonb_agg(to_jsonb(e) order by e."createdAt" desc),'[]'::jsonb) from (
        select ge.id, ge.tenant_id as "tenantId", ge.user_id as "userId", p.full_name as "userName",
               ge.event_type as "eventType", ge.severity, ge.ip_address as "ipAddress", ge.user_agent as "userAgent",
               ge.metadata, ge.resolved, ge.created_at as "createdAt"
        from guardian_events ge left join profiles p on p.id=ge.user_id order by ge.created_at desc limit 20) e),
    'recentAudit', (select coalesce(jsonb_agg(to_jsonb(a) order by a."createdAt" desc),'[]'::jsonb) from (
        select al.id, al.tenant_id as "tenantId", coalesce(t.display_name,t.legal_name,t.slug) as "tenantName",
               al.user_id as "userId", p.full_name as "userName", al.action, al.entity_type as "entityType", al.entity_id as "entityId",
               al.risk_level as "riskLevel", al.old_values as "oldValues", al.new_values as "newValues", al.created_at as "createdAt"
        from audit_log al left join profiles p on p.id=al.user_id left join tenants t on t.id=al.tenant_id order by al.created_at desc limit 20) a),
    'activeWatchlist', (select coalesce(jsonb_agg(to_jsonb(w) order by w."createdAt" desc),'[]'::jsonb) from (
        select iw.id, iw.ip_address as "ipAddress", iw.list_type as "listType", iw.reason, iw.hits, iw.expires_at as "expiresAt", iw.created_at as "createdAt"
        from ip_watchlist iw where iw.scope_tenant_id is null) w)
  ) into _res;
  return _res;
end $fn$;

-- ── TAREA 7c · Búsqueda en audit_log (filtros + paginación) ─────────────────
create or replace function public.get_audit_log(p_filters jsonb default '{}'::jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $fn$
declare _res jsonb; _limit int := least(coalesce((p_filters->>'limit')::int,20),100); _offset int := coalesce((p_filters->>'offset')::int,0);
begin
  if not is_superadmin() then raise exception 'No autorizado' using errcode='42501'; end if;
  select jsonb_build_object(
    'total', (select count(*) from audit_log al where
        (p_filters->>'tenantId' is null or al.tenant_id=(p_filters->>'tenantId')::uuid)
        and (p_filters->>'userId' is null or al.user_id=(p_filters->>'userId')::uuid)
        and (p_filters->>'entityType' is null or al.entity_type=p_filters->>'entityType')
        and (p_filters->>'action' is null or al.action=p_filters->>'action')
        and (p_filters->>'riskLevel' is null or al.risk_level=p_filters->>'riskLevel')
        and (p_filters->>'from' is null or al.created_at >= (p_filters->>'from')::timestamptz)
        and (p_filters->>'to' is null or al.created_at <= (p_filters->>'to')::timestamptz)),
    'rows', (select coalesce(jsonb_agg(to_jsonb(a) order by a."createdAt" desc),'[]'::jsonb) from (
        select al.id, al.tenant_id as "tenantId", coalesce(t.display_name,t.legal_name,t.slug) as "tenantName",
               al.user_id as "userId", p.full_name as "userName", al.action, al.entity_type as "entityType", al.entity_id as "entityId",
               al.risk_level as "riskLevel", al.old_values as "oldValues", al.new_values as "newValues", al.created_at as "createdAt"
        from audit_log al left join profiles p on p.id=al.user_id left join tenants t on t.id=al.tenant_id
        where (p_filters->>'tenantId' is null or al.tenant_id=(p_filters->>'tenantId')::uuid)
          and (p_filters->>'userId' is null or al.user_id=(p_filters->>'userId')::uuid)
          and (p_filters->>'entityType' is null or al.entity_type=p_filters->>'entityType')
          and (p_filters->>'action' is null or al.action=p_filters->>'action')
          and (p_filters->>'riskLevel' is null or al.risk_level=p_filters->>'riskLevel')
          and (p_filters->>'from' is null or al.created_at >= (p_filters->>'from')::timestamptz)
          and (p_filters->>'to' is null or al.created_at <= (p_filters->>'to')::timestamptz)
        order by al.created_at desc limit _limit offset _offset) a)
  ) into _res;
  return _res;
end $fn$;

-- ── TAREA 7c · Búsqueda en guardian_events ──────────────────────────────────
create or replace function public.get_guardian_events(p_filters jsonb default '{}'::jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $fn$
declare _res jsonb; _limit int := least(coalesce((p_filters->>'limit')::int,20),100); _offset int := coalesce((p_filters->>'offset')::int,0);
begin
  if not is_superadmin() then raise exception 'No autorizado' using errcode='42501'; end if;
  select jsonb_build_object(
    'total', (select count(*) from guardian_events ge where
        (p_filters->>'severity' is null or ge.severity=p_filters->>'severity')
        and (p_filters->>'eventType' is null or ge.event_type=p_filters->>'eventType')
        and (coalesce((p_filters->>'unresolvedOnly')::boolean,false)=false or ge.resolved=false)),
    'rows', (select coalesce(jsonb_agg(to_jsonb(e) order by e."createdAt" desc),'[]'::jsonb) from (
        select ge.id, ge.tenant_id as "tenantId", ge.user_id as "userId", p.full_name as "userName",
               ge.event_type as "eventType", ge.severity, ge.ip_address as "ipAddress", ge.user_agent as "userAgent",
               ge.metadata, ge.resolved, ge.created_at as "createdAt"
        from guardian_events ge left join profiles p on p.id=ge.user_id
        where (p_filters->>'severity' is null or ge.severity=p_filters->>'severity')
          and (p_filters->>'eventType' is null or ge.event_type=p_filters->>'eventType')
          and (coalesce((p_filters->>'unresolvedOnly')::boolean,false)=false or ge.resolved=false)
        order by ge.created_at desc limit _limit offset _offset) e)
  ) into _res;
  return _res;
end $fn$;

-- ── TAREA 7c · Resolver evento / gestionar watchlist / scan manual ──────────
create or replace function public.resolve_guardian_event(p_id uuid, p_notes text default null)
 returns void language plpgsql security definer set search_path to 'public'
as $fn$
begin
  if not is_superadmin() then raise exception 'No autorizado' using errcode='42501'; end if;
  update public.guardian_events set resolved=true, resolved_at=now(), resolved_by=auth.uid(), resolution_notes=p_notes where id=p_id;
end $fn$;

create or replace function public.manage_ip_watchlist(p_ip text, p_action text, p_list_type text default 'block', p_reason text default null, p_expires timestamptz default null)
 returns void language plpgsql security definer set search_path to 'public'
as $fn$
begin
  if not is_superadmin() then raise exception 'No autorizado' using errcode='42501'; end if;
  if p_action='remove' then
    delete from public.ip_watchlist where ip_address=p_ip and scope_tenant_id is null;
  else
    update public.ip_watchlist set list_type=p_list_type, reason=p_reason, expires_at=p_expires, created_by=auth.uid()
      where ip_address=p_ip and scope_tenant_id is null;
    if not found then
      insert into public.ip_watchlist(ip_address, list_type, reason, expires_at, created_by, hits)
        values(p_ip, p_list_type, p_reason, p_expires, auth.uid(), 0);
    end if;
  end if;
end $fn$;

create or replace function public.run_sentinel_scan(p_type text)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $fn$
begin
  if not is_superadmin() then raise exception 'No autorizado' using errcode='42501'; end if;
  return case p_type
    when 'rls_audit' then public.sentinel_rls_audit()
    when 'gl_integrity' then public.sentinel_gl_integrity()
    when 'orphan_check' then public.sentinel_orphan_check()
    when 'daily_summary' then public.sentinel_daily_summary()
    else jsonb_build_object('error','tipo de scan inválido') end;
end $fn$;

-- ── Grants explícitos (todo interno o superadmin → sin anon) ─────────────────
revoke execute on function public._sentinel_alert(text,text,text,text,jsonb) from public, anon;
revoke execute on function public.sentinel_rls_audit() from public, anon;
revoke execute on function public.sentinel_gl_integrity() from public, anon;
revoke execute on function public.sentinel_orphan_check() from public, anon;
revoke execute on function public.sentinel_daily_summary() from public, anon;
revoke execute on function public.get_security_dashboard() from public, anon;
grant  execute on function public.get_security_dashboard() to authenticated;
revoke execute on function public.get_audit_log(jsonb) from public, anon;
grant  execute on function public.get_audit_log(jsonb) to authenticated;
revoke execute on function public.get_guardian_events(jsonb) from public, anon;
grant  execute on function public.get_guardian_events(jsonb) to authenticated;
revoke execute on function public.resolve_guardian_event(uuid,text) from public, anon;
grant  execute on function public.resolve_guardian_event(uuid,text) to authenticated;
revoke execute on function public.manage_ip_watchlist(text,text,text,text,timestamptz) from public, anon;
grant  execute on function public.manage_ip_watchlist(text,text,text,text,timestamptz) to authenticated;
revoke execute on function public.run_sentinel_scan(text) from public, anon;
grant  execute on function public.run_sentinel_scan(text) to authenticated;

-- ── Crons SENTINEL ──────────────────────────────────────────────────────────
select cron.schedule('sentinel-rls-audit',     '0 4 * * 0', $c$select public.sentinel_rls_audit()$c$);
select cron.schedule('sentinel-integrity',     '0 5 * * *', $c$select public.sentinel_gl_integrity()$c$);
select cron.schedule('sentinel-orphan-check',  '30 4 * * 0', $c$select public.sentinel_orphan_check()$c$);
select cron.schedule('sentinel-daily-summary', '0 7 * * *', $c$select public.sentinel_daily_summary()$c$);
