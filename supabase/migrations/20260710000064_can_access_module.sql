-- Helper de enforcement por modulo para RLS. Lee module_access personalizado o cae a defaults del rol.
-- Mismo modelo que ROLE_DEFAULTS del frontend (@admin/domain/module-access.ts). SECURITY DEFINER: lee
-- employee_details del propio usuario aun con RLS ceo-only.
create or replace function public.can_access_module(p_module text, p_perm text default 'view')
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  _role text;
  _access jsonb;
begin
  _role := current_setting('request.jwt.claims', true)::jsonb->>'user_role';

  select ed.module_access into _access
  from public.employee_details ed
  join public.profiles p on p.id = ed.profile_id
  where p.id = auth.uid() and ed.tenant_id = current_tenant();

  -- Override personalizado por modulo (si existe la clave del modulo).
  if _access is not null and _access->p_module is not null then
    return coalesce((_access->p_module->>p_perm)::boolean, false);
  end if;

  -- Defaults por rol (espejo de ROLE_DEFAULTS).
  if _role in ('superadmin', 'ceo') then return true; end if;

  if _role = 'coo' then
    if p_module = 'settings' and p_perm <> 'view' then return false; end if;
    return true;
  end if;

  if _role = 'operaciones' then
    if p_module = 'dashboard' and p_perm = 'view' then return true; end if;
    if p_module = 'inventory' and p_perm in ('view','edit') then return true; end if;
    if p_module = 'expenses' and p_perm in ('view','create') then return true; end if;
    if p_module = 'leads' and p_perm = 'view' then return true; end if;
    return false;
  end if;

  if _role = 'servicio' then
    if p_module = 'dashboard' and p_perm = 'view' then return true; end if;
    if p_module = 'inventory' and p_perm = 'view' then return true; end if;
    return false;
  end if;

  return false;
end;
$$;

grant execute on function public.can_access_module(text, text) to authenticated;
