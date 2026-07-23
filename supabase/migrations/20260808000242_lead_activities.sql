-- =============================================
-- Ola 2.6b · lead_activities — el corazón del CRM (timeline + tareas/seguimientos)
-- Tabla aditiva. No toca leads ni get_crm_snapshot. Supera follow_up_date (muerto) con tareas reales.
-- =============================================

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  kind text not null check (kind in ('call','email','note','task','meeting','whatsapp')),
  body text,
  due_date date,                    -- solo para kind='task'
  done_at timestamptz,              -- tarea completada
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index idx_lead_activities_lead on public.lead_activities (lead_id, created_at desc);
-- Widget de seguimientos: tareas pendientes por vencer
create index idx_lead_activities_due on public.lead_activities (tenant_id, due_date)
  where kind = 'task' and done_at is null;

alter table public.lead_activities enable row level security;
create policy la_select on public.lead_activities for select using (tenant_id = current_tenant());
create policy la_insert on public.lead_activities for insert with check (tenant_id = current_tenant() and can_access_module('leads','create'));
create policy la_update on public.lead_activities for update using (tenant_id = current_tenant() and can_access_module('leads','edit'));
create policy la_delete on public.lead_activities for delete using (tenant_id = current_tenant() and can_access_module('leads','edit'));

-- add_lead_activity: { lead_id, kind, body, due_date? }. Tareas requieren due_date.
create or replace function public.add_lead_activity(_payload jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _lead uuid := (_payload->>'lead_id')::uuid; _kind text := _payload->>'kind'; _id uuid;
begin
  if not public.can_access_module('leads','create') then raise exception 'NOT_AUTHORIZED'; end if;
  if not exists (select 1 from public.leads where id=_lead and tenant_id=_t) then raise exception 'LEAD_NOT_FOUND'; end if;
  if _kind = 'task' and nullif(_payload->>'due_date','') is null then raise exception 'TASK_NEEDS_DUE_DATE'; end if;
  insert into public.lead_activities (tenant_id, lead_id, kind, body, due_date)
    values (_t, _lead, _kind, nullif(_payload->>'body',''), nullif(_payload->>'due_date','')::date)
    returning id into _id;
  return jsonb_build_object('status','ok','id',_id);
end $function$;

-- complete_lead_activity: marca la tarea como hecha.
create or replace function public.complete_lead_activity(_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant();
begin
  if not public.can_access_module('leads','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  update public.lead_activities set done_at = now() where id=_id and tenant_id=_t;
  return jsonb_build_object('status','ok');
end $function$;

-- delete_lead_activity
create or replace function public.delete_lead_activity(_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant();
begin
  if not public.can_access_module('leads','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  delete from public.lead_activities where id=_id and tenant_id=_t;
  return jsonb_build_object('status','ok');
end $function$;

-- get_pending_followups: tareas pendientes (vencidas + hoy + próximos 7 días) con su lead + bucket.
create or replace function public.get_pending_followups()
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  with t as (select case when public.can_access_module('leads','view') then public.current_tenant() else null end tid)
  select coalesce(jsonb_agg(jsonb_build_object(
    'activity_id', a.id, 'lead_id', a.lead_id, 'contact_name', l.contact_name, 'body', a.body, 'due_date', a.due_date,
    'bucket', case when a.due_date < current_date then 'overdue' when a.due_date = current_date then 'today' else 'week' end)
    order by a.due_date), '[]'::jsonb)
  from public.lead_activities a join public.leads l on l.id = a.lead_id, t
  where a.tenant_id = t.tid and a.kind = 'task' and a.done_at is null
    and a.due_date is not null and a.due_date <= current_date + 7 and l.deleted_at is null;
$function$;
