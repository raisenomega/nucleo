-- Lee el module_access personalizado del usuario actual. null = usa defaults del rol (frontend).
create or replace function public.get_my_module_access()
returns jsonb language sql stable security definer set search_path = public as $$
  select ed.module_access
  from public.employee_details ed
  join public.profiles p on p.id = ed.profile_id
  where p.id = auth.uid() and ed.tenant_id = current_tenant()
$$;

grant execute on function public.get_my_module_access() to authenticated;
