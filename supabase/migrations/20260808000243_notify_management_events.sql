-- =============================================
-- Ola 2.6c-1 · Notificaciones CRM + GESTIÓN (activar lo silencioso)
-- Helper in-app + fix _notify_tenant_owner + triggers instantáneos HR + cron diario de vencimientos.
-- Dedup por (user_id, entity_id, kind); umbral en el kind; ventanas acotadas (sin sembrar, sin spam histórico).
-- =============================================

-- A) Helper in-app puro (sin http → no necesita 'extensions'). Dedup: cada (user, entidad, tipo) una vez.
create or replace function public._notify_user(_tenant uuid, _user_id uuid, _kind text, _title text, _body text, _entity_type text, _entity_id uuid)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
begin
  if _user_id is null then return; end if;
  if exists (select 1 from public.notifications where user_id=_user_id and entity_id=_entity_id and kind=_kind) then return; end if;
  insert into public.notifications (tenant_id, user_id, kind, title, body, entity_type, entity_id)
  values (_tenant, _user_id, _kind, _title, _body, _entity_type, _entity_id);
end $function$;

-- B) Fix _notify_tenant_owner: entity_type parametrizado (default 'order' → no rompe call sites). Drop primero (evita ambigüedad de overload).
drop function if exists public._notify_tenant_owner(uuid, text, text, text, uuid, text, text);
create or replace function public._notify_tenant_owner(_tenant uuid, _kind text, _title text, _body text, _entity uuid, _subject text, _html text, _entity_type text default 'order')
 returns void language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare _uid uuid; _to text; _key text; _name text; _status int; _resp text;
begin
  select ur.user_id, pr.email into _uid, _to from public.user_roles ur join public.profiles pr on pr.id=ur.user_id
    where ur.tenant_id=_tenant and ur.role in ('ceo','superadmin') order by ur.role limit 1;
  insert into public.notifications(tenant_id,user_id,kind,title,body,entity_type,entity_id) values(_tenant,_uid,_kind,_title,_body,_entity_type,_entity);
  select coalesce(nullif(trim(display_name),''),legal_name,'NÚCLEO') into _name from public.tenants where id=_tenant;
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _to is null or _key is null then return; end if;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
  select status, content into _status, _resp from http(('POST','https://api.resend.com/emails',
    array[http_header('Authorization','Bearer '||_key)], 'application/json',
    jsonb_build_object('from',_name||' <noreply@raisen.agency>','to',_to,'subject',_subject,'html',_html)::text)::http_request);
  if _status is null or _status<200 or _status>=300 then raise warning '_notify_tenant_owner non-2xx=% entity=%',_status,_entity; end if;
exception when others then raise warning '_notify_tenant_owner EXCEPTION % entity=%', sqlerrm, _entity;
end $function$;

-- C) Triggers instantáneos (best-effort: si notificar falla, el write de HR igual pasa).
create or replace function public._notif_ticket_assigned() returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  if new.assigned_to is not null and (tg_op='INSERT' or new.assigned_to is distinct from old.assigned_to) then
    begin perform public._notify_user(new.tenant_id, new.assigned_to, 'ticket_assigned', 'Ticket asignado', coalesce(new.subject,''), 'ticket', new.id);
    exception when others then null; end;
  end if;
  return new;
end $function$;
create trigger trg_notif_ticket_assigned after insert or update of assigned_to on public.support_tickets for each row execute function public._notif_ticket_assigned();

create or replace function public._notif_ticket_comment() returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare _tk record;
begin
  begin
    select created_by, assigned_to, subject into _tk from public.support_tickets where id=new.ticket_id;
    if _tk.created_by is not null and _tk.created_by <> new.author_id then
      perform public._notify_user(new.tenant_id, _tk.created_by, 'ticket_comment', 'Nuevo comentario en ticket', coalesce(_tk.subject,''), 'ticket', new.id); end if;
    if _tk.assigned_to is not null and _tk.assigned_to <> new.author_id and _tk.assigned_to is distinct from _tk.created_by then
      perform public._notify_user(new.tenant_id, _tk.assigned_to, 'ticket_comment', 'Nuevo comentario en ticket', coalesce(_tk.subject,''), 'ticket', new.id); end if;
  exception when others then null; end;
  return new;
end $function$;
create trigger trg_notif_ticket_comment after insert on public.support_comments for each row execute function public._notif_ticket_comment();

create or replace function public._notif_evaluation() returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  begin perform public._notify_user(new.tenant_id, new.employee_id, 'evaluation_received', 'Nueva evaluación', coalesce(new.period,''), 'evaluation', new.id);
  exception when others then null; end;
  return new;
end $function$;
create trigger trg_notif_evaluation after insert on public.evaluations for each row execute function public._notif_evaluation();

create or replace function public._notif_observation() returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare _sup uuid;
begin
  if new.requires_follow_up then
    begin
      select supervisor_id into _sup from public.employee_details where profile_id=new.employee_id and tenant_id=new.tenant_id;
      perform public._notify_user(new.tenant_id, _sup, 'observation_followup', 'Observación con seguimiento', coalesce(new.category,''), 'observation', new.id);
    exception when others then null; end;
  end if;
  return new;
end $function$;
create trigger trg_notif_observation after insert on public.observations for each row execute function public._notif_observation();

create or replace function public._notif_feedback() returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  if not new.is_anonymous then
    begin perform public._notify_user(new.tenant_id, new.target_id, 'feedback_received', 'Feedback recibido', coalesce(new.feedback_type,''), 'evaluation', new.id);
    exception when others then null; end;
  end if;
  return new;
end $function$;
create trigger trg_notif_feedback after insert on public.employee_feedback for each row execute function public._notif_feedback();

-- D) Cron diario: barrido de vencimientos. Ventanas acotadas → lo ya vencido hace tiempo NO entra (sin sembrar).
create or replace function public.notify_daily_reminders() returns void language plpgsql security definer set search_path to 'public' as $function$
declare _t date := current_date;
begin
  -- 1. Tareas de seguimiento CRM (overdue reciente + hoy) → creador
  perform public._notify_user(a.tenant_id, a.created_by,
    case when a.due_date < _t then 'task_overdue' else 'task_today' end,
    case when a.due_date < _t then 'Tarea de seguimiento vencida' else 'Tarea de seguimiento para hoy' end,
    coalesce(a.body,''), 'lead', a.id)
  from public.lead_activities a
  where a.kind='task' and a.done_at is null and a.due_date is not null
    and a.due_date between _t - 14 and _t and a.created_by is not null;
  -- 2. Certificaciones por vencer (30d) → empleado + supervisor
  perform public._notify_user(c.tenant_id, r.uid, 'cert_expiring_30d', 'Certificación por vencer',
    coalesce(c.certification_name,'Certificación')||' vence '||to_char(c.expiration_date,'YYYY-MM-DD'), 'certification', c.id)
  from public.employee_certifications c
  left join public.employee_details ed on ed.profile_id=c.profile_id and ed.tenant_id=c.tenant_id
  cross join lateral unnest(array_remove(array[c.profile_id, ed.supervisor_id], null)) as r(uid)
  where c.expiration_date between _t and _t + 30;
  -- 3. Cursos vencidos/por vencer → empleado
  perform public._notify_user(tr.tenant_id, tr.employee_id, 'training_due_7d', 'Curso por vencer', '', 'training', tr.id)
  from public.training_enrollments tr
  where tr.status <> 'completed' and tr.due_date is not null
    and tr.due_date between _t - 14 and _t + 7 and tr.employee_id is not null;
  -- 4. Fin de probatorio (15d) → supervisor
  perform public._notify_user(ed.tenant_id, ed.supervisor_id, 'probation_ending_15d', 'Fin de probatorio',
    to_char(ed.probation_end_date,'YYYY-MM-DD'), 'employee', ed.profile_id)
  from public.employee_details ed
  where ed.probation_end_date between _t and _t + 15 and ed.supervisor_id is not null;
  -- 5. Examen médico (30d) → empleado + supervisor
  perform public._notify_user(ed.tenant_id, r.uid, 'medical_exam_30d', 'Examen médico por vencer',
    to_char(ed.medical_exam_next,'YYYY-MM-DD'), 'employee', ed.profile_id)
  from public.employee_details ed
  cross join lateral unnest(array_remove(array[ed.profile_id, ed.supervisor_id], null)) as r(uid)
  where ed.medical_exam_next between _t and _t + 30;
  -- 6. Drug test (30d) → empleado + supervisor
  perform public._notify_user(ed.tenant_id, r.uid, 'drug_test_30d', 'Prueba de dopaje por vencer',
    to_char(ed.drug_test_date,'YYYY-MM-DD'), 'employee', ed.profile_id)
  from public.employee_details ed
  cross join lateral unnest(array_remove(array[ed.profile_id, ed.supervisor_id], null)) as r(uid)
  where ed.drug_test_date between _t and _t + 30;
end $function$;

-- E) Cron NUEVO diario 13:00 (no toca el de citas */15 ni el de subscription-cycles 12:00).
select cron.schedule('notify-daily-reminders', '0 13 * * *', 'select public.notify_daily_reminders()');
