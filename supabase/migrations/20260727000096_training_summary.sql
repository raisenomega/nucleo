-- 20260727000096_training_summary.sql
-- MÓDULO CAPACITACIÓN (2/2): resumen de cumplimiento por empleado.
-- Por empleado: cursos asignados, completados, vencidos (due_date < hoy y no completado), % cumplimiento.
-- SECURITY DEFINER + guard training.view (patrón H3: si no autoriza, tid=null y todo vacío).

create or replace function public.get_training_summary()
returns jsonb language sql stable security definer set search_path = public as $$
  with g as (select case when public.can_access_module('training','view') then public.current_tenant() else null end as tid)
  select coalesce(jsonb_agg(jsonb_build_object(
    'employeeId', id, 'name', full_name,
    'assigned', assigned, 'completed', completed, 'overdue', overdue,
    'completionRate', case when assigned > 0 then round(100.0 * completed / assigned, 1) else 0 end
  ) order by completed desc), '[]'::jsonb)
  from (
    select p.id, p.full_name,
      (select count(*) from training_enrollments e where e.employee_id = p.id and e.tenant_id = (select tid from g)) as assigned,
      (select count(*) from training_enrollments e where e.employee_id = p.id and e.tenant_id = (select tid from g) and e.status = 'completed') as completed,
      (select count(*) from training_enrollments e where e.employee_id = p.id and e.tenant_id = (select tid from g)
        and e.status <> 'completed' and e.due_date is not null and e.due_date < current_date) as overdue
    from profiles p
    where p.tenant_id = (select tid from g)
      and exists (select 1 from training_enrollments e where e.employee_id = p.id and e.tenant_id = (select tid from g))
  ) s;
$$;
grant execute on function public.get_training_summary() to authenticated;
