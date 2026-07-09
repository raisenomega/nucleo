-- 20260808000117_service_routes_assign_check.sql
-- Seguridad (B.1): servicio solo puede ASIGNARSE y EDITAR rutas propias (assigned_to = auth.uid()).
-- Operaciones+ sin restricción. Defensa en profundidad del fix de UI (RouteForm). Rechazo explícito (42501).

-- service_routes_module_insert — anterior: WITH CHECK (tenant_id=current_tenant() AND can_access_module('routes','create'))
drop policy if exists service_routes_module_insert on public.service_routes;
create policy service_routes_module_insert on public.service_routes for insert to authenticated
  with check (tenant_id = current_tenant() and can_access_module('routes','create')
    and (is_operaciones_or_above() or assigned_to = auth.uid()));

-- service_routes_module_update — anterior: USING (tenant_id=current_tenant() AND can_access_module('routes','edit')); sin WITH CHECK
-- Ahora simétrico: el USING también acota por assignee -> servicio no puede tocar rutas ajenas (rechazo en USING).
drop policy if exists service_routes_module_update on public.service_routes;
create policy service_routes_module_update on public.service_routes for update to authenticated
  using (tenant_id = current_tenant() and can_access_module('routes','edit')
    and (is_operaciones_or_above() or assigned_to = auth.uid()))
  with check (tenant_id = current_tenant() and can_access_module('routes','edit')
    and (is_operaciones_or_above() or assigned_to = auth.uid()));
