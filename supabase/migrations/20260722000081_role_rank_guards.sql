-- 20260722000081_role_rank_guards.sql
-- AUTORIZACIÓN (medio): change_user_role y la invitación (allowed_emails) no acotaban el RANGO del
-- rol asignado -> un 'ceo' podía fabricar un 'superadmin' (rol de plataforma raisen) dentro del tenant.
-- Fix: solo un superadmin puede crear/asignar el rol 'superadmin'.

create or replace function public.change_user_role(p_user_id uuid, p_role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_ceo_or_above() then raise exception 'not authorized'; end if;
  if p_role = 'superadmin' and not public.is_superadmin() then
    raise exception 'solo un superadmin puede asignar el rol superadmin';
  end if;
  delete from public.user_roles where user_id = p_user_id and tenant_id = current_tenant();
  insert into public.user_roles (tenant_id, user_id, role) values (current_tenant(), p_user_id, p_role);
end;
$$;
grant execute on function public.change_user_role(uuid, public.app_role) to authenticated;

drop policy if exists allowed_emails_insert on public.allowed_emails;
create policy allowed_emails_insert on public.allowed_emails
  for insert to authenticated
  with check ( tenant_id = public.current_tenant() and public.is_ceo_or_above()
    and (role <> 'superadmin' or public.is_superadmin()) );

drop policy if exists allowed_emails_update on public.allowed_emails;
create policy allowed_emails_update on public.allowed_emails
  for update to authenticated
  using ( tenant_id = public.current_tenant() and public.is_ceo_or_above() )
  with check ( tenant_id = public.current_tenant() and public.is_ceo_or_above()
    and (role <> 'superadmin' or public.is_superadmin()) );
