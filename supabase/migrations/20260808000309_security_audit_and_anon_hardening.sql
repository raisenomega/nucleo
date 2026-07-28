-- ============================================================================
-- SEGURIDAD S1 · Observabilidad (audit_log + guardian_events + ip_watchlist)
--   + triggers de auditoría en tablas críticas
--   + cierre de la superficie anon (G1): revoke PUBLIC+anon, re-grant set público
-- Diseño: docs-nucleo/SEGURIDAD-NUCLEO.md v2.0 (G1/G2/G5).
-- ============================================================================

-- ── G2 · Tablas de observabilidad ───────────────────────────────────────────
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid, user_id uuid, session_id text,
  action text not null, entity_type text, entity_id uuid,
  ip_address text, user_agent text, old_values jsonb, new_values jsonb,
  risk_level text default 'low' check (risk_level in ('low','medium','high','critical')),
  created_at timestamptz default now()
);
create index if not exists idx_audit_tenant_date on public.audit_log (tenant_id, created_at desc);
create index if not exists idx_audit_user on public.audit_log (user_id, created_at desc);
create index if not exists idx_audit_entity on public.audit_log (entity_type, entity_id);
create index if not exists idx_audit_action on public.audit_log (action, created_at desc);

create table if not exists public.guardian_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid, user_id uuid,
  event_type text not null check (event_type in (
    'login_success','login_failed','logout','password_reset','password_change',
    'new_device','new_ip','brute_force_detected','rate_limit_exceeded',
    'suspicious_activity','rls_violation_attempt','role_change','permission_change',
    'sensitive_data_access','export_data','account_locked','account_unlocked')),
  severity text default 'info' check (severity in ('info','warning','high','critical')),
  ip_address text, user_agent text, metadata jsonb default '{}',
  resolved boolean default false, resolved_at timestamptz, resolved_by uuid, resolution_notes text,
  created_at timestamptz default now()
);
create index if not exists idx_guardian_severity on public.guardian_events (severity, created_at desc) where not resolved;
create index if not exists idx_guardian_user on public.guardian_events (user_id, created_at desc);

create table if not exists public.ip_watchlist (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null, list_type text not null check (list_type in ('block','allow','watch')),
  reason text, scope_tenant_id uuid, hits integer default 0, last_hit_at timestamptz,
  expires_at timestamptz, created_by uuid, created_at timestamptz default now()
);
create unique index if not exists idx_watchlist_ip on public.ip_watchlist (ip_address, coalesce(scope_tenant_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- RLS: solo superadmin lee (append-only para todos; escritura vía definer/service_role).
alter table public.audit_log enable row level security;
alter table public.guardian_events enable row level security;
alter table public.ip_watchlist enable row level security;
drop policy if exists audit_superadmin on public.audit_log;
create policy audit_superadmin on public.audit_log for select using (public.is_superadmin());
drop policy if exists guardian_superadmin on public.guardian_events;
create policy guardian_superadmin on public.guardian_events for select using (public.is_superadmin());
drop policy if exists watchlist_superadmin on public.ip_watchlist;
create policy watchlist_superadmin on public.ip_watchlist for all using (public.is_superadmin()) with check (public.is_superadmin());

-- ── Helper: registrar evento de seguridad (§5) ──────────────────────────────
create or replace function public._log_guardian_event(p_event_type text, p_severity text default 'info', p_metadata jsonb default '{}')
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare _hdr jsonb; _ip text; _ua text; _uid uuid := auth.uid();
begin
  _hdr := nullif(current_setting('request.headers', true), '')::jsonb;
  _ip := coalesce(_hdr->>'x-forwarded-for', _hdr->>'cf-connecting-ip');
  _ua := _hdr->>'user-agent';
  insert into public.guardian_events(tenant_id, user_id, event_type, severity, ip_address, user_agent, metadata)
    values (public.current_tenant(), _uid, p_event_type, p_severity, _ip, _ua, coalesce(p_metadata, '{}'));
  if p_severity = 'critical' then
    perform public._notify_user(public.current_tenant(),
      (select user_id from public.user_roles where tenant_id = public.current_tenant() and role in ('ceo','superadmin') order by role limit 1),
      'security', 'Alerta de seguridad: ' || p_event_type, coalesce(p_metadata->>'summary', p_event_type), 'guardian_event', null);
  end if;
end $function$;

-- ── G2 · Trigger genérico de auditoría ──────────────────────────────────────
create or replace function public._audit_trigger()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
declare _risk text; _tenant uuid; _eid uuid;
begin
  _risk := case tg_table_name
    when 'profiles' then 'critical' when 'employee_details' then 'critical' when 'employee_ssn' then 'critical' when 'tenants' then 'critical' when 'user_roles' then 'critical'
    when 'payroll' then 'high' when 'invoices' then 'high' when 'payroll_deduction_rules' then 'high' when 'journal_entries' then 'high' when 'vendor_bills' then 'high' when 'month_closures' then 'high'
    else 'medium' end;
  _tenant := coalesce((to_jsonb(new)->>'tenant_id')::uuid, (to_jsonb(old)->>'tenant_id')::uuid);
  _eid := coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid);
  insert into public.audit_log(tenant_id, user_id, action, entity_type, entity_id, old_values, new_values, risk_level)
    values (_tenant, auth.uid(), lower(tg_op), tg_table_name, _eid,
      case when tg_op <> 'INSERT' then to_jsonb(old) end,
      case when tg_op <> 'DELETE' then to_jsonb(new) end, _risk);
  return null;
end $function$;

-- Adjuntar a tablas críticas (AFTER, statement returns null). NO en alto volumen (gps/notifs/movs).
do $attach$
declare _t text;
begin
  foreach _t in array array[
    'profiles','employee_details','tenants','user_roles','payroll','payroll_deduction_rules',
    'invoices','journal_entries','vendor_bills','month_closures',
    'customer_profiles','quotes','sales_orders','delivery_notes','inventory_items','expenses','income','evaluations']
  loop
    if to_regclass('public.'||_t) is not null then
      execute format('drop trigger if exists trg_audit on public.%I', _t);
      execute format('create trigger trg_audit after insert or update or delete on public.%I for each row execute function public._audit_trigger()', _t);
    end if;
  end loop;
end $attach$;

-- ── G1 · Cerrar la superficie anon ──────────────────────────────────────────
-- anon tiene EXECUTE vía el grant a PUBLIC *y* un grant directo → revocar de ambos.
-- authenticated y service_role tienen grants DIRECTOS (451) → intactos. Verificado.
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;
-- Fail-secure: funciones futuras NO ejecutables por anon salvo grant explícito.
alter default privileges in schema public revoke execute on functions from anon;

-- Re-otorgar el set PÚBLICO intencional. (1) convención _public_*/get_public_* (29, todas DEFINER):
do $grant$
declare r record;
begin
  for r in select 'public.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' sig
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and (p.proname ~ '^_public' or p.proname ~ '^get_public')
  loop execute 'grant execute on function '||r.sig||' to anon'; end loop;
end $grant$;
-- (2) entradas públicas que no siguen la convención de nombre:
grant execute on function public._campaign_create_lead(text, jsonb, text) to anon;
grant execute on function public.brand_by_hostname(text) to anon;
grant execute on function public.save_appointment(uuid, jsonb) to anon;
grant execute on function public.register_customer(uuid, text, text) to anon;
-- (3) reclutamiento público (aplicar / screening / examen / subir doc):
grant execute on function public.apply_to_opening(uuid, text, text, text, text, text, text, text, text, jsonb) to anon;
grant execute on function public.get_applicant_screening_status(uuid) to anon;
grant execute on function public.get_exam_for_applicant(uuid, uuid) to anon;
grant execute on function public.submit_exam_attempt(uuid, uuid, jsonb) to anon;
grant execute on function public.get_applicant_upload_path(uuid, text) to anon;
grant execute on function public.upload_applicant_document(uuid, text, text) to anon;
