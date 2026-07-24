-- =============================================
-- Ola 2.7b · Mantenimiento preventivo (planes tiempo/km) + alertas de activos
-- A) tabla de planes + RPCs. B) extiende notify_daily_reminders (2.6c) con 5 bloques de activos.
-- Mismo patrón: ventana acotada + dedup (entity_id, kind). entity_type='asset' (ya mapeado).
-- =============================================

create table public.asset_maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant(),
  asset_id uuid not null references public.tenant_assets(id) on delete cascade,
  name text not null,
  recurrence_type text not null check (recurrence_type in ('time','meter')),
  interval_days int,
  interval_km int,
  last_done_date date,
  last_done_odometer numeric,
  alert_days_before int not null default 7,
  alert_km_before int not null default 500,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((recurrence_type='time' and interval_days is not null and interval_days > 0)
      or (recurrence_type='meter' and interval_km is not null and interval_km > 0))
);
create index idx_amp_asset on public.asset_maintenance_plans (asset_id) where is_active;
alter table public.asset_maintenance_plans enable row level security;
create policy amp_select on public.asset_maintenance_plans for select using (tenant_id = current_tenant());
create policy amp_all on public.asset_maintenance_plans for all
  using (tenant_id = current_tenant() and can_access_module('assets','edit')) with check (tenant_id = current_tenant() and can_access_module('assets','edit'));

create or replace function public.upsert_maintenance_plan(_payload jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _id uuid := nullif(_payload->>'id','')::uuid; _asset uuid := (_payload->>'asset_id')::uuid;
begin
  if not public.can_access_module('assets','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  if not exists (select 1 from public.tenant_assets where id=_asset and tenant_id=_t) then raise exception 'ASSET_NOT_FOUND'; end if;
  if _id is null then
    insert into public.asset_maintenance_plans (tenant_id, asset_id, name, recurrence_type, interval_days, interval_km, last_done_date, last_done_odometer, alert_days_before, alert_km_before, notes)
    values (_t, _asset, _payload->>'name', _payload->>'recurrence_type', nullif(_payload->>'interval_days','')::int, nullif(_payload->>'interval_km','')::int,
      nullif(_payload->>'last_done_date','')::date, nullif(_payload->>'last_done_odometer','')::numeric,
      coalesce(nullif(_payload->>'alert_days_before','')::int,7), coalesce(nullif(_payload->>'alert_km_before','')::int,500), _payload->>'notes')
    returning id into _id;
  else
    update public.asset_maintenance_plans set name=_payload->>'name', recurrence_type=_payload->>'recurrence_type',
      interval_days=nullif(_payload->>'interval_days','')::int, interval_km=nullif(_payload->>'interval_km','')::int,
      last_done_date=nullif(_payload->>'last_done_date','')::date, last_done_odometer=nullif(_payload->>'last_done_odometer','')::numeric,
      alert_days_before=coalesce(nullif(_payload->>'alert_days_before','')::int,7), alert_km_before=coalesce(nullif(_payload->>'alert_km_before','')::int,500),
      is_active=coalesce(nullif(_payload->>'is_active','')::boolean,true), notes=_payload->>'notes', updated_at=now()
    where id=_id and tenant_id=_t;
  end if;
  return jsonb_build_object('status','ok','id',_id);
end $function$;

create or replace function public.delete_maintenance_plan(_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
begin
  if not public.can_access_module('assets','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  delete from public.asset_maintenance_plans where id=_id and tenant_id=current_tenant();
  return jsonb_build_object('status','ok');
end $function$;

-- Marca hecho: actualiza el plan + registra en el log existente (historial con costo).
create or replace function public.complete_maintenance_plan(_plan_id uuid, _payload jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _p public.asset_maintenance_plans; _d date := coalesce(nullif(_payload->>'date','')::date, current_date);
begin
  if not public.can_access_module('assets','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  select * into _p from public.asset_maintenance_plans where id=_plan_id and tenant_id=_t;
  if not found then raise exception 'PLAN_NOT_FOUND'; end if;
  update public.asset_maintenance_plans set last_done_date=_d,
    last_done_odometer=coalesce(nullif(_payload->>'odometer','')::numeric, last_done_odometer), updated_at=now() where id=_plan_id;
  insert into public.asset_maintenance_log (tenant_id, asset_id, maintenance_type, description, cost, performed_at, notes)
  values (_t, _p.asset_id, 'preventive', _p.name, coalesce(nullif(_payload->>'cost','')::numeric,0), _d, _payload->>'notes');
  return jsonb_build_object('status','ok');
end $function$;

-- Estado de cada plan (time: next_due_date/days_until; meter: next_due_odometer/km_until vs odómetro más reciente).
create or replace function public.get_maintenance_status(_asset_id uuid default null)
 returns jsonb language sql stable security definer set search_path to 'public' as $function$
  with t as (select case when public.can_access_module('assets','view') then public.current_tenant() else null end tid)
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'asset_id', p.asset_id, 'name', p.name, 'recurrence_type', p.recurrence_type,
    'interval_days', p.interval_days, 'interval_km', p.interval_km, 'last_done_date', p.last_done_date, 'last_done_odometer', p.last_done_odometer,
    'alert_days_before', p.alert_days_before, 'alert_km_before', p.alert_km_before, 'is_active', p.is_active, 'notes', p.notes,
    'next_due_date', case when p.recurrence_type='time' and p.last_done_date is not null then p.last_done_date + p.interval_days end,
    'days_until', case when p.recurrence_type='time' and p.last_done_date is not null then (p.last_done_date + p.interval_days) - current_date end,
    'current_odometer', odo.o,
    'km_until', case when p.recurrence_type='meter' and p.last_done_odometer is not null then (p.last_done_odometer + p.interval_km) - coalesce(odo.o, p.last_done_odometer) end,
    'status', case
      when p.recurrence_type='time' and p.last_done_date is not null then
        case when (p.last_done_date + p.interval_days) < current_date then 'overdue'
             when (p.last_done_date + p.interval_days) <= current_date + p.alert_days_before then 'due_soon' else 'ok' end
      when p.recurrence_type='meter' and p.last_done_odometer is not null then
        case when coalesce(odo.o,0) - p.last_done_odometer >= p.interval_km then 'overdue'
             when coalesce(odo.o,0) - p.last_done_odometer >= p.interval_km - p.alert_km_before then 'due_soon' else 'ok' end
      else 'ok' end)
    order by p.name), '[]'::jsonb)
  from public.asset_maintenance_plans p, t
  left join lateral (select odometer_reading o from public.asset_custody_log where asset_id=p.asset_id and odometer_reading is not null order by custody_at desc limit 1) odo on true
  where p.tenant_id = t.tid and (_asset_id is null or p.asset_id = _asset_id);
$function$;
grant execute on function public.upsert_maintenance_plan(jsonb) to authenticated;
grant execute on function public.delete_maintenance_plan(uuid) to authenticated;
grant execute on function public.complete_maintenance_plan(uuid, jsonb) to authenticated;
grant execute on function public.get_maintenance_status(uuid) to authenticated;

-- ===== B) Extender notify_daily_reminders con 5 bloques de activos (9 previos IDÉNTICOS) =====
create or replace function public.notify_daily_reminders() returns void language plpgsql security definer set search_path to 'public' as $function$
declare _t date := current_date;
begin
  perform public._notify_user(a.tenant_id, a.created_by,
    case when a.due_date < _t then 'task_overdue' else 'task_today' end,
    case when a.due_date < _t then 'Tarea de seguimiento vencida' else 'Tarea de seguimiento para hoy' end,
    coalesce(a.body,''), 'lead', a.id)
  from public.lead_activities a
  where a.kind='task' and a.done_at is null and a.due_date is not null and a.due_date between _t - 14 and _t and a.created_by is not null;
  perform public._notify_user(c.tenant_id, r.uid, 'cert_expiring_30d', 'Certificación por vencer',
    coalesce(c.certification_name,'Certificación')||' vence '||to_char(c.expiration_date,'YYYY-MM-DD'), 'certification', c.id)
  from public.employee_certifications c
  left join public.employee_details ed on ed.profile_id=c.profile_id and ed.tenant_id=c.tenant_id
  cross join lateral unnest(array_remove(array[c.profile_id, ed.supervisor_id], null)) as r(uid)
  where c.expiration_date between _t and _t + 30;
  perform public._notify_user(tr.tenant_id, tr.employee_id, 'training_due_7d', 'Curso por vencer', '', 'training', tr.id)
  from public.training_enrollments tr
  where tr.status <> 'completed' and tr.due_date is not null and tr.due_date between _t - 14 and _t + 7 and tr.employee_id is not null;
  perform public._notify_user(ed.tenant_id, ed.supervisor_id, 'probation_ending_15d', 'Fin de probatorio',
    to_char(ed.probation_end_date,'YYYY-MM-DD'), 'employee', ed.profile_id)
  from public.employee_details ed where ed.probation_end_date between _t and _t + 15 and ed.supervisor_id is not null;
  perform public._notify_user(ed.tenant_id, r.uid, 'medical_exam_30d', 'Examen médico por vencer',
    to_char(ed.medical_exam_next,'YYYY-MM-DD'), 'employee', ed.profile_id)
  from public.employee_details ed cross join lateral unnest(array_remove(array[ed.profile_id, ed.supervisor_id], null)) as r(uid)
  where ed.medical_exam_next between _t and _t + 30;
  perform public._notify_user(ed.tenant_id, r.uid, 'drug_test_30d', 'Prueba de dopaje por vencer',
    to_char(ed.drug_test_date,'YYYY-MM-DD'), 'employee', ed.profile_id)
  from public.employee_details ed cross join lateral unnest(array_remove(array[ed.profile_id, ed.supervisor_id], null)) as r(uid)
  where ed.drug_test_date between _t and _t + 30;
  perform public._notify_user(i.tenant_id, ur.user_id, 'invoice_overdue', 'Factura '||coalesce(i.invoice_number,'')||' vencida',
    '$'||to_char(coalesce(i.balance,0),'FM999999990.00')||' pendientes desde '||to_char(i.due_date,'YYYY-MM-DD'), 'invoice', i.id)
  from public.invoices i join public.user_roles ur on ur.tenant_id=i.tenant_id and ur.role in ('ceo','superadmin')
  where i.due_date < _t and i.due_date >= _t - 60 and i.status not in ('paid','cancelled') and coalesce(i.balance,0) > 0;
  perform public._notify_user(it.tenant_id, ur.user_id, 'stock_low', 'Stock bajo: '||coalesce(it.name,''),
    it.stock||' unidades (mínimo '||it.min_stock||')', 'inventory_item', it.id)
  from public.inventory_items it join public.user_roles ur on ur.tenant_id=it.tenant_id and ur.role in ('ceo','superadmin')
  where it.min_stock > 0 and it.stock <= it.min_stock;
  perform public._notify_user(d.tenant_id, ur.user_id, 'document_expiring', 'Documento por vencer: '||coalesce(d.title,''),
    'vence '||to_char(d.expiration_date,'YYYY-MM-DD'), 'document', d.id)
  from public.documents d join public.user_roles ur on ur.tenant_id=d.tenant_id and ur.role in ('ceo','superadmin')
  where d.status='active' and d.expiration_date is not null and d.expiration_date between _t and _t + coalesce(d.reminder_days, 30);
  -- 10/11. Mantenimiento por tiempo (próximo + vencido reciente) → asignado del activo, o CEO(s) si no hay
  perform public._notify_user(p.tenant_id, rc.uid,
    case when (p.last_done_date + p.interval_days) < _t then 'maintenance_overdue' else 'maintenance_due_soon' end,
    case when (p.last_done_date + p.interval_days) < _t then 'Mantenimiento vencido: '||p.name else 'Mantenimiento próximo: '||p.name end,
    'vence '||to_char((p.last_done_date + p.interval_days),'YYYY-MM-DD'), 'asset', p.asset_id)
  from public.asset_maintenance_plans p join public.tenant_assets a on a.id=p.asset_id
  cross join lateral (select a.assigned_to uid where a.assigned_to is not null
    union all select ur.user_id from public.user_roles ur where a.assigned_to is null and ur.tenant_id=p.tenant_id and ur.role in ('ceo','superadmin')) rc
  where p.is_active and p.recurrence_type='time' and p.last_done_date is not null
    and (p.last_done_date + p.interval_days) between _t - 30 and _t + p.alert_days_before;
  -- 12. Mantenimiento por km (odómetro actual − last_done ≥ intervalo − alerta) → asignado / CEO(s)
  perform public._notify_user(p.tenant_id, rc.uid, 'maintenance_km_due', 'Mantenimiento por km: '||p.name,
    'cada '||p.interval_km||' km', 'asset', p.asset_id)
  from public.asset_maintenance_plans p join public.tenant_assets a on a.id=p.asset_id
  cross join lateral (select a.assigned_to uid where a.assigned_to is not null
    union all select ur.user_id from public.user_roles ur where a.assigned_to is null and ur.tenant_id=p.tenant_id and ur.role in ('ceo','superadmin')) rc
  where p.is_active and p.recurrence_type='meter' and p.last_done_odometer is not null
    and (coalesce((select odometer_reading from public.asset_custody_log cl where cl.asset_id=p.asset_id and cl.odometer_reading is not null order by cl.custody_at desc limit 1),0) - p.last_done_odometer) >= (p.interval_km - p.alert_km_before);
  -- 13. Garantía por vencer (30d) → CEO(s)
  perform public._notify_user(a.tenant_id, ur.user_id, 'warranty_expiring_30d', 'Garantía por vencer: '||a.name,
    'vence '||to_char(a.warranty_expires,'YYYY-MM-DD'), 'asset', a.id)
  from public.tenant_assets a join public.user_roles ur on ur.tenant_id=a.tenant_id and ur.role in ('ceo','superadmin')
  where a.warranty_expires between _t and _t + 30;
  -- 14. Seguro por vencer (30d) → CEO(s)
  perform public._notify_user(a.tenant_id, ur.user_id, 'insurance_expiring_30d', 'Seguro por vencer: '||a.name,
    'vence '||to_char(a.insurance_expires,'YYYY-MM-DD'), 'asset', a.id)
  from public.tenant_assets a join public.user_roles ur on ur.tenant_id=a.tenant_id and ur.role in ('ceo','superadmin')
  where a.insurance_expires between _t and _t + 30;
end $function$;
