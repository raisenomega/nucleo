-- ============================================================================
-- BLOQUE-A · Modo demo (VitalMotion): is_demo_tenant + reset diario + PIN owner + guards
--   Guard por TRIGGER genérico (no reescribe 22 RPCs): BEFORE DELETE/UPDATE en tablas
--   críticas, table-agnostic vía to_jsonb. Owner mode = sesión con PIN verificado
--   (cuenta demo compartida → se distingue por session_id del JWT). Reset = borrado
--   por timestamp-baseline (todo lo creado tras el seed, salvo protegido por el owner).
-- GOTCHA grants ([[anon-execute-fail-secure]]): internos/superadmin → sin anon.
-- ============================================================================

-- event_types nuevos
alter table public.guardian_events drop constraint if exists guardian_events_event_type_check;
alter table public.guardian_events add constraint guardian_events_event_type_check check (
  event_type = any(array['login_success','login_failed','logout','password_reset','password_change',
    'new_device','new_ip','brute_force_detected','rate_limit_exceeded','suspicious_activity',
    'rls_violation_attempt','role_change','permission_change','sensitive_data_access','export_data',
    'account_locked','account_unlocked','rls_audit_failed','integrity_check_failed','orphan_detected','security_summary',
    'mfa_enrolled','mfa_disabled','mfa_challenge_failed','hermes_drift','demo_reset','demo_owner_login']));

-- ── TAREA 1a · Flag ─────────────────────────────────────────────────────────
alter table public.tenants add column if not exists is_demo_tenant boolean not null default false;
update public.tenants set is_demo_tenant = true where slug = 'vital-motion-cafbf0';

-- ── TAREA 1b · demo_config ──────────────────────────────────────────────────
create table if not exists public.demo_config (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid unique not null references public.tenants(id) on delete cascade,
  reset_enabled boolean default true,
  reset_hour integer default 0,
  last_reset_at timestamptz,
  seed_baseline_at timestamptz not null default now(),  -- todo lo <= baseline es seed (protegido)
  owner_pin_hash text,                                  -- lo setea Jojo (no se commitea)
  owner_user_id uuid references auth.users(id),
  allow_delete boolean default false,
  allow_settings boolean default false,
  allow_role_change boolean default false,
  allow_export boolean default false,
  demo_banner_text text default 'Esta es una cuenta de demostración. Los datos se reinician cada 24 horas.',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.demo_config enable row level security;
drop policy if exists demo_config_read on public.demo_config;
-- lectura para miembros del tenant demo (para el banner); escritura sólo superadmin
create policy demo_config_read on public.demo_config for select using (tenant_id = current_tenant() or is_superadmin());
drop policy if exists demo_config_write on public.demo_config;
create policy demo_config_write on public.demo_config for all using (is_superadmin()) with check (is_superadmin());

insert into public.demo_config (tenant_id, owner_user_id)
  select id, (select id from auth.users where email='vitalmotionpr@gmail.com')
  from public.tenants where slug='vital-motion-cafbf0'
on conflict (tenant_id) do nothing;

-- ── TAREA 1c · demo_protected_ids (rows del owner que sobreviven al reset) ───
create table if not exists public.demo_protected_ids (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entity_type text not null, entity_id uuid not null,
  reason text default 'owner', created_at timestamptz default now(),
  unique (tenant_id, entity_type, entity_id)
);
alter table public.demo_protected_ids enable row level security;
drop policy if exists demo_protected_sa on public.demo_protected_ids;
create policy demo_protected_sa on public.demo_protected_ids for all using (is_superadmin());

-- Sesiones con owner mode verificado (cuenta compartida → clave = session_id del JWT).
create table if not exists public.demo_owner_sessions (
  session_id text primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  verified_at timestamptz default now(), expires_at timestamptz not null
);
alter table public.demo_owner_sessions enable row level security;
drop policy if exists demo_owner_sessions_sa on public.demo_owner_sessions;
create policy demo_owner_sessions_sa on public.demo_owner_sessions for all using (is_superadmin());

-- ── TAREA 2 · is_demo_tenant() + _demo_is_owner() ───────────────────────────
create or replace function public.is_demo_tenant()
 returns boolean language sql stable security definer set search_path to 'public'
as $fn$ select coalesce((select is_demo_tenant from public.tenants where id = current_tenant()), false) $fn$;

create or replace function public._demo_is_owner()
 returns boolean language sql stable security definer set search_path to 'public'
as $fn$
  select exists (
    select 1 from public.demo_owner_sessions s
    where s.tenant_id = public.current_tenant()
      and s.session_id = nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'session_id'
      and s.expires_at > now())
$fn$;

-- ── TAREA 3 · Guard genérico (BEFORE DELETE/UPDATE) ─────────────────────────
create or replace function public._demo_write_guard()
 returns trigger language plpgsql security definer set search_path to 'public'
as $fn$
declare _rec jsonb; _tid uuid; _demo boolean; _sn text; _so text; _ret record;
begin
  if tg_op='DELETE' then _ret := old; else _ret := new; end if;
  _rec := to_jsonb(_ret);
  _tid := case when tg_table_name='tenants' then (_rec->>'id')::uuid else (_rec->>'tenant_id')::uuid end;
  if _tid is null then return _ret; end if;
  select is_demo_tenant into _demo from public.tenants where id=_tid;
  if not coalesce(_demo,false) then return _ret; end if;
  if is_superadmin() or public._demo_is_owner() then return _ret; end if;  -- superadmin/owner pueden todo
  -- demo user (no owner):
  if tg_op='DELETE' then raise exception 'Acción no disponible en modo demo (borrado)' using errcode='P0001'; end if;
  if tg_table_name in ('tenants','user_roles') then
    raise exception 'Acción no disponible en modo demo (configuración)' using errcode='P0001'; end if;
  _so := to_jsonb(old)->>'status'; _sn := to_jsonb(new)->>'status';
  if _sn is distinct from _so and (tg_table_name='profiles' or _sn ~* 'void|cancel|anul') then
    raise exception 'Acción no disponible en modo demo (anular/cancelar)' using errcode='P0001'; end if;
  return new;
end $fn$;

-- Protege los rows creados por el owner (sobreviven al reset).
create or replace function public._demo_protect_owner_insert()
 returns trigger language plpgsql security definer set search_path to 'public'
as $fn$
declare _tid uuid;
begin
  _tid := (to_jsonb(new)->>'tenant_id')::uuid;
  if _tid is null then return new; end if;
  if coalesce((select is_demo_tenant from public.tenants where id=_tid), false) and public._demo_is_owner() then
    insert into public.demo_protected_ids(tenant_id, entity_type, entity_id, reason)
      values(_tid, tg_table_name, new.id, 'owner') on conflict do nothing;
  end if;
  return new;
end $fn$;

-- Adjunta los triggers a las tablas críticas (excluye routes: sin tenant_id).
do $attach$
declare t text; _guard text[] := array['invoices','income','expenses','vendor_bills','vendor_bill_payments',
  'journal_entries','invoice_payments','sales_orders','delivery_notes','quotes','customer_profiles',
  'customer_contacts','customer_addresses','customer_segments','lead_activities','asset_maintenance_plans',
  'training_resources','campaign_pages','campaign_blocks','tenants','user_roles','profiles','inventory_items','leads'];
  _protect text[] := array['invoices','sales_orders','delivery_notes','quotes','customer_profiles',
    'customer_contacts','customer_addresses','lead_activities','inventory_items','leads','income','expenses'];
begin
  foreach t in array _guard loop
    execute format('drop trigger if exists trg_demo_guard on public.%I', t);
    execute format('create trigger trg_demo_guard before delete or update on public.%I for each row execute function public._demo_write_guard()', t);
  end loop;
  foreach t in array _protect loop
    execute format('drop trigger if exists trg_demo_protect on public.%I', t);
    execute format('create trigger trg_demo_protect after insert on public.%I for each row execute function public._demo_protect_owner_insert()', t);
  end loop;
end $attach$;

-- ── TAREA 5 · PIN owner ─────────────────────────────────────────────────────
create or replace function public.set_demo_owner_pin(p_tenant_id uuid, p_pin text)
 returns void language plpgsql security definer set search_path to 'public','extensions'
as $fn$
begin
  if not is_superadmin() then raise exception 'No autorizado' using errcode='42501'; end if;
  if p_pin !~ '^[0-9]{4}$' then raise exception 'El PIN debe ser 4 dígitos'; end if;
  update public.demo_config set owner_pin_hash = crypt(p_pin, gen_salt('bf')), updated_at=now() where tenant_id=p_tenant_id;
end $fn$;

create or replace function public.verify_demo_owner_pin(p_pin text)
 returns boolean language plpgsql security definer set search_path to 'public','extensions'
as $fn$
declare _hash text; _sid text; _ok boolean;
begin
  select owner_pin_hash into _hash from public.demo_config where tenant_id = current_tenant();
  if _hash is null then return false; end if;
  _ok := (_hash = crypt(p_pin, _hash));
  if not _ok then return false; end if;
  _sid := nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'session_id';
  if _sid is null then return false; end if;   -- sin session_id no hay owner mode fiable
  insert into public.demo_owner_sessions(session_id, tenant_id, expires_at)
    values(_sid, current_tenant(), now()+interval '8 hours')
    on conflict (session_id) do update set expires_at = now()+interval '8 hours', verified_at = now();
  insert into public.guardian_events(tenant_id, user_id, event_type, severity, metadata)
    values(current_tenant(), auth.uid(), 'demo_owner_login', 'info', jsonb_build_object('summary','Modo owner activado'));
  return true;
end $fn$;

-- ── TAREA 4 · Reset diario ──────────────────────────────────────────────────
create or replace function public.reset_demo_tenant()
 returns void language plpgsql security definer set search_path to 'public'
as $fn$
declare c record; t record; _has_id boolean; _sql text; _deny text[] := array['tenants','user_roles','profiles',
  'demo_config','demo_protected_ids','demo_owner_sessions','audit_log','guardian_events','sentinel_scans',
  'hermes_checkpoints','ip_watchlist','rate_limit_public','notifications'];
begin
  set local session_replication_role = 'replica';  -- desactiva triggers+FK durante el borrado (owner = postgres)
  for c in select dc.tenant_id, dc.seed_baseline_at from public.demo_config dc
      join public.tenants te on te.id=dc.tenant_id where te.is_demo_tenant and coalesce(dc.reset_enabled,true) loop
    for t in select c2.table_name from information_schema.columns c2
        where c2.table_schema='public' and c2.column_name='tenant_id'
          and c2.table_name not in (select unnest(_deny))
          and exists (select 1 from information_schema.columns x where x.table_schema='public' and x.table_name=c2.table_name and x.column_name='created_at')
        group by c2.table_name loop
      _has_id := exists (select 1 from information_schema.columns x where x.table_schema='public' and x.table_name=t.table_name and x.column_name='id');
      if _has_id then
        _sql := format('delete from public.%I where tenant_id=$1 and created_at > $2 and id not in (select entity_id from public.demo_protected_ids where tenant_id=$1)', t.table_name);
      else
        _sql := format('delete from public.%I where tenant_id=$1 and created_at > $2', t.table_name);
      end if;
      begin execute _sql using c.tenant_id, c.seed_baseline_at; exception when others then null; end;
    end loop;
    update public.demo_config set last_reset_at=now() where tenant_id=c.tenant_id;
    delete from public.demo_owner_sessions where tenant_id=c.tenant_id;  -- limpia sesiones owner
    insert into public.guardian_events(tenant_id, event_type, severity, metadata)
      values(c.tenant_id, 'demo_reset', 'info', jsonb_build_object('summary','Reset diario del demo'));
  end loop;
  set local session_replication_role = 'origin';
end $fn$;

-- ── Grants ──────────────────────────────────────────────────────────────────
revoke execute on function public._demo_is_owner() from public, anon;
revoke execute on function public._demo_write_guard() from public, anon;
revoke execute on function public._demo_protect_owner_insert() from public, anon;
revoke execute on function public.reset_demo_tenant() from public, anon;
revoke execute on function public.set_demo_owner_pin(uuid,text) from public, anon;
grant  execute on function public.set_demo_owner_pin(uuid,text) to authenticated;
revoke execute on function public.verify_demo_owner_pin(text) from public, anon;
grant  execute on function public.verify_demo_owner_pin(text) to authenticated;
-- is_demo_tenant() la lee el frontend autenticado (y es inocua) → authenticated
grant  execute on function public.is_demo_tenant() to authenticated;

-- ── Cron: reset a medianoche UTC (8pm PR) ───────────────────────────────────
select cron.schedule('demo-reset', '0 0 * * *', $c$select public.reset_demo_tenant()$c$);
