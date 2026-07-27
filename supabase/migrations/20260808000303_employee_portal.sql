-- 20260808000303_employee_portal.sql
-- RRHH-8 — Portal del empleado (self-service). RPCs SECURITY DEFINER self-scoped a auth.uid():
-- employee_details / employee_certifications / training_enrollments tienen RLS solo staff (is_ceo_or_above /
-- can_access_module), así que un empleado servicio NO puede leer lo suyo directo → estos RPCs son el puente.
-- Nómina/vacaciones/asistencia/evaluaciones ya tienen ruta propia del empleado (RLS payroll self, useLeave,
-- ClockWidget, get_my_evaluations). NO se abren campos de admin (salario/rol/accesos): update es whitelist.

-- Mis datos (perfil + expediente en modo lectura para el portal).
create or replace function public.get_my_employee_details() returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'full_name', p.full_name, 'email', p.email, 'phone', p.phone, 'position', p.position, 'avatar_url', p.avatar_url,
    'department', d.department, 'hire_date', d.hire_date,
    'address_line1', d.address_line1, 'address_line2', d.address_line2, 'city', d.city,
    'state_province', d.state_province, 'zip_code', d.zip_code,
    'personal_phone', d.personal_phone, 'alternate_phone', d.alternate_phone, 'personal_email', d.personal_email,
    'emergency_name', d.emergency_name, 'emergency_relationship', d.emergency_relationship,
    'emergency_phone', d.emergency_phone, 'emergency_phone_alt', d.emergency_phone_alt, 'emergency_address', d.emergency_address)
  from public.profiles p left join public.employee_details d on d.profile_id = p.id
  where p.id = auth.uid();
$$;

-- Edición limitada: solo dirección / teléfonos personales / contacto de emergencia. Crea la fila si falta.
create or replace function public.update_my_employee_details(p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'No autenticado'; end if;
  if not exists (select 1 from public.employee_details where profile_id = _uid) then
    insert into public.employee_details (profile_id, tenant_id) values (_uid, public.current_tenant());
  end if;
  update public.employee_details set
    address_line1          = coalesce(p_data->>'address_line1', address_line1),
    address_line2          = coalesce(p_data->>'address_line2', address_line2),
    city                   = coalesce(p_data->>'city', city),
    state_province         = coalesce(p_data->>'state_province', state_province),
    zip_code               = coalesce(p_data->>'zip_code', zip_code),
    personal_phone         = coalesce(p_data->>'personal_phone', personal_phone),
    alternate_phone        = coalesce(p_data->>'alternate_phone', alternate_phone),
    personal_email         = coalesce(p_data->>'personal_email', personal_email),
    emergency_name         = coalesce(p_data->>'emergency_name', emergency_name),
    emergency_relationship = coalesce(p_data->>'emergency_relationship', emergency_relationship),
    emergency_phone        = coalesce(p_data->>'emergency_phone', emergency_phone),
    emergency_phone_alt    = coalesce(p_data->>'emergency_phone_alt', emergency_phone_alt),
    emergency_address      = coalesce(p_data->>'emergency_address', emergency_address)
  where profile_id = _uid;  -- salary/role/module_access/etc. NUNCA se tocan aquí
end $$;

-- Mis certificaciones.
create or replace function public.get_my_certifications() returns jsonb
language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', certification_name, 'number', certification_number,
    'issued', issued_date, 'expires', expiration_date, 'status', status, 'source', source,
    'document_url', document_url) order by expiration_date nulls last), '[]'::jsonb)
  from public.employee_certifications where profile_id = auth.uid();
$$;

-- Mis cursos asignados (con título/estado/score/límite/obligatorio).
create or replace function public.get_my_training() returns jsonb
language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'course_id', e.course_id, 'title', c.title,
    'status', e.status, 'score', e.score, 'due_date', e.due_date, 'required', c.required,
    'category', c.category) order by e.created_at desc), '[]'::jsonb)
  from public.training_enrollments e join public.training_courses c on c.id = e.course_id
  where e.employee_id = auth.uid();
$$;

-- Evaluaciones pendientes de completar (donde YO soy el evaluador): self/peer/bottom_up del ciclo activo.
create or replace function public.get_my_pending_evaluations() returns jsonb
language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', ev.id, 'employee_name', pe.full_name,
    'eval_type', ev.eval_type, 'cycle', cy.name, 'period', ev.period) order by ev.created_at), '[]'::jsonb)
  from public.evaluations ev
    left join public.profiles pe on pe.id = ev.employee_id
    left join public.evaluation_cycles cy on cy.id = ev.cycle_id
  where ev.evaluator_id = auth.uid() and ev.status = 'pending';
$$;

-- Resumen del dashboard del portal (KPIs + pendientes) en una sola llamada.
create or replace function public.get_my_portal_summary() returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'last_payroll', (select jsonb_build_object('period', period, 'date', pay_date, 'net', net_salary)
      from public.payroll where employee_id = auth.uid() and deleted_at is null order by pay_date desc limit 1),
    'available_leave', coalesce((select sum(available) from public.leave_balances
      where employee_id = auth.uid() and year = extract(year from current_date)::int), 0),
    'courses_total', (select count(*) from public.training_enrollments where employee_id = auth.uid()),
    'courses_completed', (select count(*) from public.training_enrollments where employee_id = auth.uid() and status = 'completed'),
    'pending_evaluations', (select count(*) from public.evaluations where evaluator_id = auth.uid() and status = 'pending'),
    'pending_onboarding', (select count(*) from public.onboarding_tasks tk
      join public.onboarding_checklists cl on cl.id = tk.checklist_id
      where cl.employee_id = auth.uid() and cl.status <> 'completed' and tk.status = 'pending' and tk.assigned_to = 'employee'),
    'expiring_certs', (select count(*) from public.employee_certifications where profile_id = auth.uid()
      and expiration_date is not null and expiration_date between current_date and current_date + 30
      and coalesce(status, 'active') <> 'expired'));
$$;

grant execute on function public.get_my_employee_details(), public.update_my_employee_details(jsonb),
  public.get_my_certifications(), public.get_my_training(), public.get_my_pending_evaluations(),
  public.get_my_portal_summary() to authenticated;
