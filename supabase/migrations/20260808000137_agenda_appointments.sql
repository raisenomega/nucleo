-- Migración 137: Agenda A-2a — citas + notifications in-app + save_appointment (valida conflicto/bloqueo)
-- + recordatorios pg_cron (24h/1h). RLS: appointments tenant+CEO; notifications propias del user (insert vía DEFINER).
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  service_id uuid references public.tenant_landing_services(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'agendada' check (status in ('agendada','confirmada','completada','cancelada','no-show')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists idx_appointments_tenant_range on public.appointments(tenant_id, starts_at, ends_at);
create index if not exists idx_appointments_lead on public.appointments(lead_id) where lead_id is not null;
create index if not exists idx_appointments_upcoming on public.appointments(tenant_id, starts_at) where status in ('agendada','confirmada');
alter table public.appointments enable row level security;
create policy appointments_select on public.appointments for select using (tenant_id = current_tenant());
create policy appointments_all on public.appointments for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above())
  with check (tenant_id = current_tenant() and public.is_ceo_or_above());

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null, title text not null, body text,
  entity_type text, entity_id uuid, read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, created_at desc) where read_at is null;
alter table public.notifications enable row level security;
create policy notifications_select on public.notifications for select using (user_id = auth.uid());
create policy notifications_update on public.notifications for update using (user_id = auth.uid());

create or replace function public.save_appointment(p_id uuid, p jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _t uuid := current_tenant(); _s timestamptz := (p->>'starts_at')::timestamptz; _e timestamptz := (p->>'ends_at')::timestamptz; _id uuid;
begin
  if not public.is_ceo_or_above() then return jsonb_build_object('status','error','code','forbidden'); end if;
  if _e <= _s then return jsonb_build_object('status','error','code','bad_range'); end if;
  if exists (select 1 from public.appointments a where a.tenant_id=_t and a.status in ('agendada','confirmada')
      and (p_id is null or a.id <> p_id) and a.starts_at < _e and a.ends_at > _s) then
    return jsonb_build_object('status','error','code','conflict'); end if;
  if exists (select 1 from public.blocked_periods b where b.tenant_id=_t and b.starts_at < _e and b.ends_at > _s) then
    return jsonb_build_object('status','error','code','blocked'); end if;
  if p_id is null then
    insert into public.appointments (tenant_id, lead_id, service_id, title, starts_at, ends_at, status, notes, created_by)
    values (_t, nullif(p->>'lead_id','')::uuid, nullif(p->>'service_id','')::uuid, p->>'title', _s, _e, coalesce(p->>'status','agendada'), p->>'notes', auth.uid())
    returning id into _id;
  else
    update public.appointments set lead_id=nullif(p->>'lead_id','')::uuid, service_id=nullif(p->>'service_id','')::uuid, title=p->>'title',
      starts_at=_s, ends_at=_e, status=coalesce(p->>'status','agendada'), notes=p->>'notes', updated_at=now()
    where id=p_id and tenant_id=_t returning id into _id;
  end if;
  return jsonb_build_object('status','ok','id',_id);
end $fn$;
grant execute on function public.save_appointment(uuid, jsonb) to authenticated;

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
end $fn$;
select cron.schedule('notify-appointments-reminders', '*/15 * * * *', $$select public.notify_upcoming_appointments()$$);
