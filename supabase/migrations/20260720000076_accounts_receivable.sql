-- 20260720000076_accounts_receivable.sql
-- Cuentas por cobrar: lee las paradas con deuda pendiente (pending_collection=true).
-- SECURITY DEFINER + tenant-scoped: coo/ceo ven TODAS las deudas del tenant (no filtra por creador).
-- p_month = fecha de corte ("hasta"): default hoy -> muestra todas las deudas vigentes.

create or replace function public.get_accounts_receivable(p_month date default current_date)
returns jsonb language sql stable security definer set search_path = public as $$
  with ar as (
    select s.id as "stopId", s.client_name as "clientName", s.phone,
      s.estimated_amount as amount, r.route_date as "routeDate",
      coalesce(p.full_name, '—') as "assignedTo", s.notes as reason
    from route_stops s
      join service_routes r on r.id = s.route_id
      left join profiles p on p.id = r.assigned_to
    where s.pending_collection = true
      and r.tenant_id = current_tenant()
      and r.route_date <= p_month
    order by r.route_date desc
  )
  select jsonb_build_object(
    'total_pending', coalesce((select sum(amount) from ar), 0),
    'count', (select count(*) from ar),
    'items', coalesce((select jsonb_agg(to_jsonb(t)) from ar t), '[]'::jsonb)
  );
$$;
grant execute on function public.get_accounts_receivable(date) to authenticated;

-- Acceso al módulo: ceo/coo ya reciben true por su catch-all. Añadimos operaciones=view. servicio=false (default).
create or replace function public.can_access_module(p_module text, p_perm text default 'view')
returns boolean language plpgsql stable security definer set search_path = public as $$
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
    if p_module = 'routes' then return true; end if;
    return false;
  end if;
  if _role = 'servicio' then
    if p_module = 'dashboard' and p_perm = 'view' then return true; end if;
    if p_module = 'inventory' and p_perm = 'view' then return true; end if;
    if p_module = 'routes' and p_perm in ('view', 'create', 'edit') then return true; end if;
    return false;
  end if;
  return false;
end;
$$;
