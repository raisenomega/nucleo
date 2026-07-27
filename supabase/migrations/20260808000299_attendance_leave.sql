-- RRHH-5A — Asistencia (Time & Attendance) + Vacaciones/Ausencias (Leave Management). Backend.
-- Cierra el GAP total confirmado por la auditoría: antes solo había contadores en employee_details.
-- Diseño: clock-in/out con GPS → horas/overtime/tardanza; solicitudes de ausencia → aprobación →
-- balance descontado; calendario de equipo. Auto-checkout + acumulación de balance por cron.

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLAS
-- ═══════════════════════════════════════════════════════════════════════════
create table public.attendance_config (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid unique not null references public.tenants(id) on delete cascade,
  work_start_time time default '08:00', work_end_time time default '17:00',
  daily_hours_limit numeric default 8, weekly_hours_limit numeric default 40,
  overtime_multiplier numeric default 1.5, grace_minutes integer default 15,
  auto_checkout_enabled boolean default true, auto_checkout_after_hours numeric default 12,
  require_gps boolean default false, timezone text default 'America/Puerto_Rico',
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table public.employee_attendance (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.profiles(id),
  clock_in timestamptz not null, clock_in_lat numeric, clock_in_lng numeric,
  clock_in_method text default 'app' check (clock_in_method in ('app','web','manual','kiosk')), clock_in_note text,
  clock_out timestamptz, clock_out_lat numeric, clock_out_lng numeric,
  clock_out_method text check (clock_out_method in ('app','web','manual','kiosk','auto')), clock_out_note text,
  hours_worked numeric, hours_regular numeric, hours_overtime numeric,
  status text not null default 'active' check (status in ('active','completed','adjusted','voided')),
  is_late boolean default false, late_minutes integer default 0,
  adjusted_by uuid references public.profiles(id), adjustment_reason text,
  work_date date not null default current_date, created_at timestamptz default now(), updated_at timestamptz default now()
);
-- Un solo clock-in ACTIVO por empleado (índice único parcial — evita btree_gist/EXCLUDE).
create unique index one_active_attendance on public.employee_attendance (employee_id) where status = 'active';
create index idx_attendance_emp_date on public.employee_attendance (tenant_id, employee_id, work_date);

create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, code text not null,
  is_paid boolean not null default true,
  accrual_type text default 'none' check (accrual_type in ('none','monthly','biweekly','annual','per_hour')),
  accrual_rate numeric default 0, max_balance numeric, carry_over boolean default false, max_carry_over numeric,
  requires_approval boolean default true, min_advance_days integer default 1,
  color text default '#3b82f6', is_active boolean not null default true, is_system boolean not null default false,
  created_at timestamptz default now(), unique (tenant_id, code)
);

create table public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.profiles(id),
  leave_type_id uuid not null references public.leave_types(id),
  year integer not null,
  accrued numeric not null default 0, used numeric not null default 0, pending numeric not null default 0,
  available numeric generated always as (accrued - used - pending) stored, carried_over numeric default 0,
  updated_at timestamptz default now(), unique (tenant_id, employee_id, leave_type_id, year)
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.profiles(id),
  leave_type_id uuid not null references public.leave_types(id),
  start_date date not null, end_date date not null, days_requested numeric not null,
  is_half_day boolean default false, half_day_period text check (half_day_period in ('morning','afternoon')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')), reason text,
  approved_by uuid references public.profiles(id), approved_at timestamptz, rejection_reason text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- prep integración nómina (columnas opcionales — el vínculo horas→pago se hará en una fase futura).
alter table public.payroll add column if not exists hours_regular numeric, add column if not exists hours_overtime numeric;

create trigger trg_att_cfg_updated before update on public.attendance_config for each row execute function public.set_updated_at();
create trigger trg_attendance_updated before update on public.employee_attendance for each row execute function public.set_updated_at();
create trigger trg_leave_bal_updated before update on public.leave_balances for each row execute function public.set_updated_at();
create trigger trg_leave_req_updated before update on public.leave_requests for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.attendance_config enable row level security;
alter table public.employee_attendance enable row level security;
alter table public.leave_types enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security;

create policy acfg_sel on public.attendance_config for select using (tenant_id = public.current_tenant());
create policy acfg_wr on public.attendance_config for all using (tenant_id = public.current_tenant() and public.is_ceo_or_above()) with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());
create policy att_sel on public.employee_attendance for select using (tenant_id = public.current_tenant() and (public.is_ceo_or_above() or employee_id = auth.uid()));
create policy att_ins on public.employee_attendance for insert with check (tenant_id = public.current_tenant() and employee_id = auth.uid());
create policy att_upd on public.employee_attendance for update using (tenant_id = public.current_tenant() and public.is_ceo_or_above());
create policy lt_sel on public.leave_types for select using (tenant_id = public.current_tenant());
create policy lt_wr on public.leave_types for all using (tenant_id = public.current_tenant() and public.is_ceo_or_above()) with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());
create policy lb_sel on public.leave_balances for select using (tenant_id = public.current_tenant() and (public.is_ceo_or_above() or employee_id = auth.uid()));
create policy lr_sel on public.leave_requests for select using (tenant_id = public.current_tenant() and (public.is_ceo_or_above() or employee_id = auth.uid()));
create policy lr_ins on public.leave_requests for insert with check (tenant_id = public.current_tenant() and employee_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- HELPERS
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public._business_days(_start date, _end date) returns numeric language sql immutable as $$
  select count(*)::numeric from generate_series(_start, _end, interval '1 day') d where extract(dow from d) not in (0, 6);
$$;

-- garantiza la fila de balance del año; los tipos no-acumulables con tope nacen con accrued=tope.
create or replace function public._ensure_leave_balance(_tenant uuid, _emp uuid, _type uuid, _year int)
returns void language plpgsql security definer set search_path to 'public' as $$
declare _lt public.leave_types;
begin
  select * into _lt from public.leave_types where id = _type;
  insert into public.leave_balances(tenant_id, employee_id, leave_type_id, year, accrued)
  values (_tenant, _emp, _type, _year, case when _lt.accrual_type = 'none' and _lt.max_balance is not null then _lt.max_balance else 0 end)
  on conflict (tenant_id, employee_id, leave_type_id, year) do nothing;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPCs — ASISTENCIA
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.clock_in(p_lat numeric default null, p_lng numeric default null, p_method text default 'app', p_note text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _t uuid := public.current_tenant(); _emp uuid := auth.uid(); _cfg public.attendance_config; _id uuid;
  _local time; _start time; _grace int; _late bool := false; _latemin int := 0;
begin
  if _emp is null then raise exception 'No autenticado'; end if;
  if exists (select 1 from public.employee_attendance where employee_id = _emp and status = 'active') then
    raise exception 'Ya tienes una entrada activa'; end if;
  select * into _cfg from public.attendance_config where tenant_id = _t;
  _start := coalesce(_cfg.work_start_time, '08:00'); _grace := coalesce(_cfg.grace_minutes, 15);
  _local := (now() at time zone coalesce(_cfg.timezone, 'America/Puerto_Rico'))::time;
  if _local > (_start + (_grace || ' minutes')::interval) then
    _late := true; _latemin := floor(extract(epoch from (_local - _start)) / 60);
  end if;
  insert into public.employee_attendance(tenant_id, employee_id, clock_in, clock_in_lat, clock_in_lng, clock_in_method, clock_in_note, is_late, late_minutes)
  values (_t, _emp, now(), p_lat, p_lng, p_method, p_note, _late, _latemin) returning id into _id;
  return _id;
end $$;

create or replace function public.clock_out(p_lat numeric default null, p_lng numeric default null, p_method text default 'app', p_note text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare _t uuid := public.current_tenant(); _emp uuid := auth.uid(); _att public.employee_attendance; _worked numeric; _limit numeric;
begin
  select * into _att from public.employee_attendance where employee_id = _emp and status = 'active' order by clock_in desc limit 1;
  if _att.id is null then raise exception 'No hay entrada activa'; end if;
  select coalesce(daily_hours_limit, 8) into _limit from public.attendance_config where tenant_id = _t;
  _limit := coalesce(_limit, 8);
  _worked := round(extract(epoch from (now() - _att.clock_in)) / 3600, 2);
  update public.employee_attendance set clock_out = now(), clock_out_lat = p_lat, clock_out_lng = p_lng,
    clock_out_method = p_method, clock_out_note = p_note, hours_worked = _worked,
    hours_regular = least(_worked, _limit), hours_overtime = greatest(0, _worked - _limit),
    status = 'completed', updated_at = now() where id = _att.id;
end $$;

create or replace function public.auto_checkout_stale() returns void language plpgsql security definer set search_path to 'public' as $$
declare a record; _cfg public.attendance_config; _out timestamptz; _worked numeric; _limit numeric;
begin
  for a in select * from public.employee_attendance where status = 'active' loop
    select * into _cfg from public.attendance_config where tenant_id = a.tenant_id;
    if coalesce(_cfg.auto_checkout_enabled, true) and a.clock_in + (coalesce(_cfg.auto_checkout_after_hours, 12) || ' hours')::interval < now() then
      _out := a.clock_in + (coalesce(_cfg.auto_checkout_after_hours, 12) || ' hours')::interval;
      _limit := coalesce(_cfg.daily_hours_limit, 8);
      _worked := round(extract(epoch from (_out - a.clock_in)) / 3600, 2);
      update public.employee_attendance set clock_out = _out, clock_out_method = 'auto', hours_worked = _worked,
        hours_regular = least(_worked, _limit), hours_overtime = greatest(0, _worked - _limit), status = 'completed', updated_at = now() where id = a.id;
    end if;
  end loop;
end $$;

create or replace function public.adjust_attendance(p_attendance_id uuid, p_clock_in timestamptz default null, p_clock_out timestamptz default null, p_reason text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare a public.employee_attendance; _ci timestamptz; _co timestamptz; _worked numeric; _limit numeric; _t uuid := public.current_tenant();
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select * into a from public.employee_attendance where id = p_attendance_id and tenant_id = _t;
  if a.id is null then raise exception 'Registro no encontrado'; end if;
  _ci := coalesce(p_clock_in, a.clock_in); _co := coalesce(p_clock_out, a.clock_out);
  select coalesce(daily_hours_limit, 8) into _limit from public.attendance_config where tenant_id = _t;
  _limit := coalesce(_limit, 8);
  if _co is not null then _worked := round(extract(epoch from (_co - _ci)) / 3600, 2); end if;
  update public.employee_attendance set clock_in = _ci, clock_out = _co, hours_worked = _worked,
    hours_regular = case when _worked is null then null else least(_worked, _limit) end,
    hours_overtime = case when _worked is null then null else greatest(0, _worked - _limit) end,
    status = 'adjusted', adjusted_by = auth.uid(), adjustment_reason = p_reason, updated_at = now() where id = a.id;
end $$;

create or replace function public.get_attendance_summary(p_employee_id uuid default null, p_from date default date_trunc('month', current_date)::date, p_to date default current_date)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _t uuid := public.current_tenant();
begin
  if not (public.is_ceo_or_above() or p_employee_id = auth.uid()) then raise exception 'No autorizado'; end if;
  if p_employee_id is not null then
    return (select jsonb_build_object('total_hours', coalesce(sum(hours_worked),0), 'regular_hours', coalesce(sum(hours_regular),0),
      'overtime_hours', coalesce(sum(hours_overtime),0), 'days_worked', count(distinct work_date), 'days_late', count(*) filter (where is_late),
      'avg_hours_per_day', round(coalesce(sum(hours_worked),0) / nullif(count(distinct work_date),0), 2))
      from public.employee_attendance where tenant_id = _t and employee_id = p_employee_id and work_date between p_from and p_to and status <> 'voided');
  end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('employee_id', s.employee_id, 'name', p.full_name, 'total_hours', s.th,
    'regular_hours', s.rh, 'overtime_hours', s.oh, 'days_worked', s.dw, 'days_late', s.dl) order by p.full_name), '[]'::jsonb)
    from (select employee_id, sum(hours_worked) th, sum(hours_regular) rh, sum(hours_overtime) oh, count(distinct work_date) dw, count(*) filter (where is_late) dl
          from public.employee_attendance where tenant_id = _t and work_date between p_from and p_to and status <> 'voided' group by employee_id) s
    join public.profiles p on p.id = s.employee_id);
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPCs — VACACIONES / AUSENCIAS
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.request_leave(p_leave_type_id uuid, p_start_date date, p_end_date date, p_reason text default null, p_is_half_day boolean default false, p_half_day_period text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _t uuid := public.current_tenant(); _emp uuid := auth.uid(); _lt public.leave_types; _bal public.leave_balances;
  _days numeric; _year int := extract(year from p_start_date); _id uuid; _unlimited bool;
begin
  if _emp is null then raise exception 'No autenticado'; end if;
  select * into _lt from public.leave_types where id = p_leave_type_id and tenant_id = _t and is_active;
  if _lt.id is null then raise exception 'Tipo de ausencia inválido'; end if;
  if p_end_date < p_start_date then raise exception 'Rango inválido'; end if;
  if p_start_date < current_date + _lt.min_advance_days then raise exception 'Debe solicitar con anticipación'; end if;
  _days := case when p_is_half_day then 0.5 else public._business_days(p_start_date, p_end_date) end;
  if _days <= 0 then raise exception 'Sin días hábiles en el rango'; end if;
  if exists (select 1 from public.leave_requests where employee_id = _emp and status in ('pending','approved')
    and daterange(start_date, end_date, '[]') && daterange(p_start_date, p_end_date, '[]')) then
    raise exception 'Solapa con otra solicitud'; end if;
  perform public._ensure_leave_balance(_t, _emp, p_leave_type_id, _year);
  select * into _bal from public.leave_balances where tenant_id = _t and employee_id = _emp and leave_type_id = p_leave_type_id and year = _year;
  _unlimited := _lt.accrual_type = 'none' and _lt.max_balance is null;
  if not _unlimited and _bal.available < _days then raise exception 'Balance insuficiente'; end if;
  insert into public.leave_requests(tenant_id, employee_id, leave_type_id, start_date, end_date, days_requested, is_half_day, half_day_period, reason)
  values (_t, _emp, p_leave_type_id, p_start_date, p_end_date, _days, p_is_half_day, p_half_day_period, p_reason) returning id into _id;
  update public.leave_balances set pending = pending + _days, updated_at = now() where id = _bal.id;
  return _id;
end $$;

create or replace function public.approve_leave(p_request_id uuid) returns void language plpgsql security definer set search_path to 'public' as $$
declare r public.leave_requests; _t uuid := public.current_tenant();
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select * into r from public.leave_requests where id = p_request_id and tenant_id = _t and status = 'pending';
  if r.id is null then raise exception 'Solicitud no encontrada o no pendiente'; end if;
  update public.leave_requests set status = 'approved', approved_by = auth.uid(), approved_at = now(), updated_at = now() where id = r.id;
  update public.leave_balances set pending = pending - r.days_requested, used = used + r.days_requested, updated_at = now()
    where tenant_id = _t and employee_id = r.employee_id and leave_type_id = r.leave_type_id and year = extract(year from r.start_date);
end $$;

create or replace function public.reject_leave(p_request_id uuid, p_reason text default null) returns void language plpgsql security definer set search_path to 'public' as $$
declare r public.leave_requests; _t uuid := public.current_tenant();
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select * into r from public.leave_requests where id = p_request_id and tenant_id = _t and status = 'pending';
  if r.id is null then raise exception 'Solicitud no encontrada o no pendiente'; end if;
  update public.leave_requests set status = 'rejected', rejection_reason = p_reason, updated_at = now() where id = r.id;
  update public.leave_balances set pending = pending - r.days_requested, updated_at = now()
    where tenant_id = _t and employee_id = r.employee_id and leave_type_id = r.leave_type_id and year = extract(year from r.start_date);
end $$;

create or replace function public.cancel_leave(p_request_id uuid) returns void language plpgsql security definer set search_path to 'public' as $$
declare r public.leave_requests; _t uuid := public.current_tenant();
begin
  select * into r from public.leave_requests where id = p_request_id and tenant_id = _t and employee_id = auth.uid() and status = 'pending';
  if r.id is null then raise exception 'Solo puedes cancelar tus solicitudes pendientes'; end if;
  update public.leave_requests set status = 'cancelled', updated_at = now() where id = r.id;
  update public.leave_balances set pending = pending - r.days_requested, updated_at = now()
    where tenant_id = _t and employee_id = r.employee_id and leave_type_id = r.leave_type_id and year = extract(year from r.start_date);
end $$;

create or replace function public.accrue_leave_balances() returns void language plpgsql security definer set search_path to 'public' as $$
declare rec record; _acc numeric; _year int := extract(year from current_date); _hours numeric;
begin
  for rec in select p.tenant_id, p.id as emp, lt.id as type_id, lt.accrual_type, lt.accrual_rate, lt.max_balance
    from public.profiles p join public.user_roles ur on ur.user_id = p.id
    join public.leave_types lt on lt.tenant_id = p.tenant_id and lt.is_active and lt.accrual_type <> 'none'
  loop
    if rec.accrual_type = 'per_hour' then
      select coalesce(sum(hours_regular), 0) into _hours from public.employee_attendance
        where employee_id = rec.emp and work_date >= (date_trunc('month', current_date) - interval '1 month')::date
          and work_date < date_trunc('month', current_date)::date and status <> 'voided';
      _acc := rec.accrual_rate * _hours;
    else
      _acc := case rec.accrual_type when 'monthly' then rec.accrual_rate when 'biweekly' then rec.accrual_rate * 2
        when 'annual' then rec.accrual_rate / 12 else 0 end;
    end if;
    if _acc <= 0 then continue; end if;
    perform public._ensure_leave_balance(rec.tenant_id, rec.emp, rec.type_id, _year);
    update public.leave_balances set accrued = case when rec.max_balance is not null then least(accrued + _acc, rec.max_balance) else accrued + _acc end, updated_at = now()
      where tenant_id = rec.tenant_id and employee_id = rec.emp and leave_type_id = rec.type_id and year = _year;
  end loop;
end $$;

create or replace function public.get_team_calendar(p_month int, p_year int) returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when public.is_ceo_or_above() then coalesce((
    select jsonb_agg(jsonb_build_object('request_id', lr.id, 'employee_id', lr.employee_id, 'employee_name', p.full_name,
      'leave_type', lt.name, 'color', lt.color, 'start_date', lr.start_date, 'end_date', lr.end_date, 'is_half_day', lr.is_half_day) order by lr.start_date)
    from public.leave_requests lr join public.profiles p on p.id = lr.employee_id join public.leave_types lt on lt.id = lr.leave_type_id
    where lr.tenant_id = public.current_tenant() and lr.status = 'approved'
      and daterange(lr.start_date, lr.end_date, '[]') && daterange(make_date(p_year, p_month, 1), (make_date(p_year, p_month, 1) + interval '1 month')::date, '[]')
  ), '[]'::jsonb) else '[]'::jsonb end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICACIONES — nueva solicitud → CEO/COO; aprobada/rechazada → empleado.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public._notify_leave_request() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _ceo uuid; _emp text; _type text;
begin
  select full_name into _emp from public.profiles where id = new.employee_id;
  select name into _type from public.leave_types where id = new.leave_type_id;
  if tg_op = 'INSERT' then
    for _ceo in select user_id from public.user_roles where tenant_id = new.tenant_id and role in ('ceo','coo','superadmin') loop
      begin perform public._notify_user(new.tenant_id, _ceo, 'leave_request', 'Solicitud de ausencia',
        coalesce(_emp,'') || ' solicita ' || coalesce(_type,'') || ' (' || new.start_date || ' → ' || new.end_date || ')', 'leave', new.id); exception when others then null; end;
    end loop;
  elsif new.status <> old.status and new.status in ('approved','rejected') then
    begin perform public._notify_user(new.tenant_id, new.employee_id, 'leave_' || new.status,
      case when new.status = 'approved' then 'Ausencia aprobada' else 'Ausencia rechazada' end,
      coalesce(_type,'') || ' ' || new.start_date || (case when new.status = 'rejected' and new.rejection_reason is not null then ': ' || new.rejection_reason else '' end), 'leave', new.id); exception when others then null; end;
  end if;
  return new;
end $$;
create trigger trg_notify_leave_request after insert or update of status on public.leave_requests
  for each row execute function public._notify_leave_request();

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED de tipos de ausencia (PR): todos los tenants + los nuevos vía trigger.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public._seed_leave_types(_t uuid) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.leave_types(tenant_id, name, code, is_paid, accrual_type, accrual_rate, max_balance, carry_over, max_carry_over, requires_approval, min_advance_days, color, is_system) values
    (_t,'Vacaciones','VAC',true,'monthly',1.25,30,true,5,true,7,'#3b82f6',true),
    (_t,'Enfermedad','ENF',true,'monthly',1,15,false,null,true,0,'#ef4444',true),
    (_t,'Personal','PER',false,'none',0,3,false,null,true,1,'#6b7280',true),
    (_t,'Maternidad','MAT',true,'none',0,56,false,null,true,15,'#ec4899',true),
    (_t,'Paternidad','PAT',true,'none',0,5,false,null,true,7,'#14b8a6',true),
    (_t,'Compensatorio','COMP',true,'none',0,null,false,null,true,1,'#a855f7',true),
    (_t,'Duelo','DUE',true,'none',0,5,false,null,false,0,'#64748b',true)
  on conflict (tenant_id, code) do nothing;
end $$;
create or replace function public._seed_leave_types_trg() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin perform public._seed_leave_types(new.id); return new; end $$;
drop trigger if exists trg_seed_leave_types on public.tenants;
create trigger trg_seed_leave_types after insert on public.tenants for each row execute function public._seed_leave_types_trg();
select public._seed_leave_types(id) from public.tenants;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED demo (tenant Zafacones — 4 empleados reales): config + balances + solicitudes + asistencia.
-- ═══════════════════════════════════════════════════════════════════════════
do $$
declare _t uuid := '61205cb9-1418-4bfa-a029-bbb44d4e4310';
  _roy uuid := 'fb9be0cb-d5c9-4bf7-b522-93614d09ba1c'; _steph uuid := 'd4768116-4e86-4b88-bf9e-8bc2d3a206a9';
  _johanny uuid := 'e9bd1007-62d1-4bc7-b2cf-8e492bdd5028'; _vac uuid; _year int := extract(year from current_date);
  _d date; _e uuid; _ci timestamp; _co timestamp; _worked numeric; _late bool;
begin
  if not exists (select 1 from public.tenants where id = _t) then return; end if;
  if exists (select 1 from public.attendance_config where tenant_id = _t) then return; end if;
  insert into public.attendance_config(tenant_id) values (_t);
  select id into _vac from public.leave_types where tenant_id = _t and code = 'VAC';
  perform public._ensure_leave_balance(_t, _roy, _vac, _year);
  perform public._ensure_leave_balance(_t, _steph, _vac, _year);
  perform public._ensure_leave_balance(_t, _johanny, _vac, _year);
  update public.leave_balances set accrued = 7.5 where tenant_id = _t and leave_type_id = _vac and employee_id = _roy and year = _year;
  update public.leave_balances set accrued = 7.5, used = 3 where tenant_id = _t and leave_type_id = _vac and employee_id = _steph and year = _year;
  update public.leave_balances set accrued = 5, pending = 2 where tenant_id = _t and leave_type_id = _vac and employee_id = _johanny and year = _year;
  insert into public.leave_requests(tenant_id, employee_id, leave_type_id, start_date, end_date, days_requested, status, approved_by, approved_at, reason)
    values (_t, _steph, _vac, current_date - 30, current_date - 28, 3, 'approved', _roy, now(), 'Vacaciones familiares');
  insert into public.leave_requests(tenant_id, employee_id, leave_type_id, start_date, end_date, days_requested, status, reason)
    values (_t, _johanny, _vac, current_date + 7, current_date + 8, 2, 'pending', 'Asuntos personales');
  for _d in select d::date from generate_series(current_date - 14, current_date - 1, interval '1 day') d where extract(dow from d) not in (0, 6) loop
    for _e in select unnest(array[_roy, _steph]) loop
      _ci := _d + time '08:00' + (case when extract(day from _d)::int % 4 = 0 then interval '20 minutes' else interval '5 minutes' end);
      _co := _d + time '17:00' + (case when extract(day from _d)::int % 3 = 0 then interval '45 minutes' else interval '0 minutes' end);
      _worked := round(extract(epoch from (_co - _ci)) / 3600, 2);
      _late := _ci::time > time '08:15';
      insert into public.employee_attendance(tenant_id, employee_id, clock_in, clock_out, clock_in_method, clock_out_method,
        hours_worked, hours_regular, hours_overtime, status, is_late, late_minutes, work_date)
        values (_t, _e, _ci, _co, 'app', 'app', _worked, least(_worked, 8), greatest(0, _worked - 8), 'completed', _late,
          case when _late then floor(extract(epoch from (_ci::time - time '08:00')) / 60)::int else 0 end, _d);
    end loop;
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- CRONS + GRANTS
-- ═══════════════════════════════════════════════════════════════════════════
do $$ begin if exists (select 1 from cron.job where jobname = 'auto-checkout') then perform cron.unschedule('auto-checkout'); end if; end $$;
select cron.schedule('auto-checkout', '0 * * * *', $$select public.auto_checkout_stale()$$);
do $$ begin if exists (select 1 from cron.job where jobname = 'accrue-leave') then perform cron.unschedule('accrue-leave'); end if; end $$;
select cron.schedule('accrue-leave', '0 6 1 * *', $$select public.accrue_leave_balances()$$);

grant execute on function public.clock_in(numeric, numeric, text, text) to authenticated;
grant execute on function public.clock_out(numeric, numeric, text, text) to authenticated;
grant execute on function public.request_leave(uuid, date, date, text, boolean, text) to authenticated;
grant execute on function public.cancel_leave(uuid) to authenticated;
grant execute on function public.approve_leave(uuid) to authenticated;
grant execute on function public.reject_leave(uuid, text) to authenticated;
grant execute on function public.adjust_attendance(uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.get_attendance_summary(uuid, date, date) to authenticated;
grant execute on function public.get_team_calendar(integer, integer) to authenticated;
