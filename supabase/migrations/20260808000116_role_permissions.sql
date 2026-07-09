-- 20260808000116_role_permissions.sql
-- Refactor de permisos por rol (COMMIT B). Solo cambia SELECT-RLS + defaults de can_access_module.
-- NO toca INSERT/UPDATE/DELETE de ninguna tabla. Tablas afectadas (6): income, expenses,
-- service_routes, route_stops, observations, training_enrollments.
--   • income/expenses/service_routes/route_stops: "ve todo" pasa de COO+ a OPERACIONES+ (servicio
--     sigue acotado a lo suyo por created_by/assigned_to).
--   • observations/training_enrollments: SELECT pasa de gate de módulo a "COO+ ve todo, cada quien
--     ve lo suyo (employee_id = auth.uid())". Operaciones se comporta como servicio (personales).

-- 1) can_access_module: se reproduce el cuerpo actual + se AGREGAN los nuevos view por rol.
create or replace function public.can_access_module(p_module text, p_perm text default 'view')
returns boolean language plpgsql stable security definer set search_path to 'public' as $$
declare _role text; _access jsonb;
begin
  _role := current_setting('request.jwt.claims', true)::jsonb->>'user_role';
  select ed.module_access into _access from public.employee_details ed
    join public.profiles p on p.id = ed.profile_id
    where p.id = auth.uid() and ed.tenant_id = current_tenant();
  if _access is not null and _access->p_module is not null then
    return coalesce((_access->p_module->>p_perm)::boolean, false);
  end if;
  if _role in ('superadmin', 'ceo') then return true; end if;
  if _role = 'coo' then
    if p_module = 'settings' and p_perm not in ('view', 'categories') then return false; end if;
    return true;
  end if;
  if _role = 'operaciones' then
    if p_module = 'dashboard' and p_perm = 'view' then return true; end if;
    if p_module = 'inventory' and p_perm in ('view', 'edit') then return true; end if;
    if p_module = 'expenses' and p_perm in ('view', 'create') then return true; end if;
    if p_module = 'leads' and p_perm = 'view' then return true; end if;
    if p_module = 'accounts_receivable' and p_perm = 'view' then return true; end if;
    if p_module = 'reports' and p_perm = 'view' then return true; end if;
    if p_module = 'routes' then return true; end if;
    -- 116: operaciones ve income/observations/training (expenses.view ya cubierto arriba).
    if p_module = 'income' and p_perm = 'view' then return true; end if;
    if p_module = 'observations' and p_perm = 'view' then return true; end if;
    if p_module = 'training' and p_perm = 'view' then return true; end if;
    return false;
  end if;
  if _role = 'servicio' then
    if p_module = 'dashboard' and p_perm = 'view' then return true; end if;
    if p_module = 'inventory' and p_perm = 'view' then return true; end if;
    if p_module = 'routes' and p_perm in ('view', 'create', 'edit') then return true; end if;
    -- 116: servicio ve income/expenses/observations/training.
    if p_module = 'income' and p_perm = 'view' then return true; end if;
    if p_module = 'expenses' and p_perm = 'view' then return true; end if;
    if p_module = 'observations' and p_perm = 'view' then return true; end if;
    if p_module = 'training' and p_perm = 'view' then return true; end if;
    return false;
  end if;
  return false;
end; $$;

-- 2) Policies SELECT (DROP + CREATE). Cada una con su versión anterior comentada para trazabilidad.

-- income_tenant_select — anterior: USING (tenant_id=current_tenant() AND (is_coo_or_above() OR created_by=auth.uid()))
drop policy if exists income_tenant_select on public.income;
create policy income_tenant_select on public.income for select to authenticated
  using (tenant_id = current_tenant() and (is_operaciones_or_above() or created_by = auth.uid()));

-- expenses_tenant_select — anterior: USING (tenant_id=current_tenant() AND (is_coo_or_above() OR created_by=auth.uid()))
drop policy if exists expenses_tenant_select on public.expenses;
create policy expenses_tenant_select on public.expenses for select to authenticated
  using (tenant_id = current_tenant() and (is_operaciones_or_above() or created_by = auth.uid()));

-- service_routes_tenant_select — anterior: USING (tenant_id=current_tenant() AND (is_coo_or_above() OR created_by=auth.uid() OR assigned_to=auth.uid()))
drop policy if exists service_routes_tenant_select on public.service_routes;
create policy service_routes_tenant_select on public.service_routes for select to authenticated
  using (tenant_id = current_tenant() and (is_operaciones_or_above() or created_by = auth.uid() or assigned_to = auth.uid()));

-- route_stops_tenant_select — anterior: USING (tenant_id=current_tenant() AND (is_coo_or_above() OR route_id IN (select id from service_routes where created_by=auth.uid() OR assigned_to=auth.uid())))
drop policy if exists route_stops_tenant_select on public.route_stops;
create policy route_stops_tenant_select on public.route_stops for select to authenticated
  using (tenant_id = current_tenant() and (is_operaciones_or_above() or route_id in (
    select id from public.service_routes where created_by = auth.uid() or assigned_to = auth.uid())));

-- DECISIÓN INTENCIONAL: la fila propia (employee_id = auth.uid()) es visible SIEMPRE,
-- independiente de overrides administrativos que revoquen 'observations.view' o 'training.view'.
-- Un CEO no debería poder revocarle a un empleado el acceso a la observación/capacitación
-- que le hizo directamente. El gate de UI SÍ respeta el override (oculta el módulo del menú),
-- pero el RLS SELECT es defense-in-depth: si llegan por URL directa, ven solo lo suyo.

-- obs_sel — anterior: USING (tenant_id=current_tenant() AND can_access_module('observations','view'))
drop policy if exists obs_sel on public.observations;
create policy obs_sel on public.observations for select to authenticated
  using (tenant_id = current_tenant() and (is_coo_or_above() or employee_id = auth.uid()));

-- enroll_sel — anterior: USING (tenant_id=current_tenant() AND can_access_module('training','view'))
drop policy if exists enroll_sel on public.training_enrollments;
create policy enroll_sel on public.training_enrollments for select to authenticated
  using (tenant_id = current_tenant() and (is_coo_or_above() or employee_id = auth.uid()));
