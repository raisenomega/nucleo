-- Defaults de columna para que el insert no requiera tenant_id explícito.
alter table public.service_routes alter column tenant_id set default current_tenant();
alter table public.route_stops   alter column tenant_id set default current_tenant();

-- SELECT service_routes: coo+ ven todo; el creador y el empleado asignado ven la ruta.
drop policy if exists service_routes_tenant_select on public.service_routes;
create policy service_routes_tenant_select on public.service_routes for select to authenticated
  using (tenant_id = current_tenant()
    and (public.is_coo_or_above() or created_by = auth.uid() or assigned_to = auth.uid()));

-- SELECT route_stops: sin created_by/assigned_to -> hereda de la ruta padre.
drop policy if exists route_stops_tenant_select on public.route_stops;
create policy route_stops_tenant_select on public.route_stops for select to authenticated
  using (tenant_id = current_tenant() and (public.is_coo_or_above() or route_id in (
    select id from public.service_routes where created_by = auth.uid() or assigned_to = auth.uid())));

-- Escritura gateada por can_access_module('routes', perm).
create policy service_routes_module_insert on public.service_routes for insert to authenticated
  with check (tenant_id = current_tenant() and public.can_access_module('routes', 'create'));
create policy service_routes_module_update on public.service_routes for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('routes', 'edit'));
create policy service_routes_module_delete on public.service_routes for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('routes', 'delete'));

create policy route_stops_module_insert on public.route_stops for insert to authenticated
  with check (tenant_id = current_tenant() and public.can_access_module('routes', 'create'));
create policy route_stops_module_update on public.route_stops for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('routes', 'edit'));
create policy route_stops_module_delete on public.route_stops for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('routes', 'delete'));
