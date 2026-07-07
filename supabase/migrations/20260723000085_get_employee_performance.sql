-- 20260723000085_get_employee_performance.sql
-- REPORTES · Pilar Empleados: rendimiento por empleado en [p_from, p_to].
-- Por empleado: paradas completadas / no atendidas / tasa de cobro / ingresos cobrados / insumos usados / costo laboral.
-- SECURITY DEFINER + guard reports.view. coo+ ven a todos; roles menores (operaciones) solo su propio rendimiento.

create or replace function public.get_employee_performance(p_from date, p_to date)
returns jsonb language sql stable security definer set search_path = public as $$
with g as (
  select case when public.can_access_module('reports','view') then public.current_tenant() else null end as tid,
         public.is_coo_or_above() as allsee
)
select coalesce(jsonb_agg(jsonb_build_object(
  'employeeId', id, 'name', full_name,
  'completed', completed, 'notAttended', not_attended,
  'stops', completed + not_attended,
  'collectionRate', case when (completed + not_attended) > 0
                         then round(100.0 * completed / (completed + not_attended), 1) else 0 end,
  'incomeCollected', income_collected, 'suppliesUsed', supplies_used, 'laborCost', labor_cost
) order by income_collected desc), '[]'::jsonb)
from (
  select p.id, p.full_name,
    (select count(*) from route_stops s join service_routes r on r.id = s.route_id
      where r.assigned_to = p.id and r.tenant_id = (select tid from g)
        and r.route_date between p_from and p_to and s.status = 'Completada') as completed,
    (select count(*) from route_stops s join service_routes r on r.id = s.route_id
      where r.assigned_to = p.id and r.tenant_id = (select tid from g)
        and r.route_date between p_from and p_to and s.status = 'No atendido') as not_attended,
    (select coalesce(sum(s.actual_amount), 0) from route_stops s join service_routes r on r.id = s.route_id
      where r.assigned_to = p.id and r.tenant_id = (select tid from g)
        and r.route_date between p_from and p_to and s.linked_income_id is not null) as income_collected,
    (select coalesce(sum(im.quantity), 0) from inventory_movements im
       join route_stops s on s.id = im.linked_stop_id join service_routes r on r.id = s.route_id
      where r.assigned_to = p.id and im.tenant_id = (select tid from g)
        and im.movement_date between p_from and p_to and im.deleted_at is null) as supplies_used,
    (select coalesce(sum(coalesce(nullif(pay.total_employer_cost, 0), pay.amount)), 0) from payroll pay
      where pay.employee_id = p.id and pay.tenant_id = (select tid from g)
        and pay.pay_date between p_from and p_to and pay.deleted_at is null) as labor_cost
  from profiles p
  where p.tenant_id = (select tid from g)
    and ((select allsee from g) or p.id = auth.uid())
) e
$$;

grant execute on function public.get_employee_performance(date, date) to authenticated;
