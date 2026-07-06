-- can_access_module con el módulo 'routes': operaciones CRUD completo; servicio view/create/edit.
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
