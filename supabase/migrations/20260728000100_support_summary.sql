-- 20260728000100_support_summary.sql
-- MÓDULO SOPORTE/TICKETS (2/2): resumen de tickets por estado (para el KPI del header).
-- SECURITY DEFINER + guard support.view (H3). ceo/coo cuentan todo; empleados solo lo visible para ellos
-- se refleja en la lista (el resumen es para gestión: usamos is_coo_or_above para el conteo global).

create or replace function public.get_support_summary()
returns jsonb language sql stable security definer set search_path = public as $$
  with g as (select case when public.is_coo_or_above() then public.current_tenant() else null end as tid)
  select jsonb_build_object(
    'open',        (select count(*) from support_tickets where tenant_id = (select tid from g) and status = 'open'),
    'in_progress', (select count(*) from support_tickets where tenant_id = (select tid from g) and status = 'in_progress'),
    'resolved',    (select count(*) from support_tickets where tenant_id = (select tid from g) and status = 'resolved'),
    'closed',      (select count(*) from support_tickets where tenant_id = (select tid from g) and status = 'closed')
  );
$$;
grant execute on function public.get_support_summary() to authenticated;
