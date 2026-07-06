-- changeRole atómico: reemplaza el delete+insert del cliente (no transaccional) por un RPC.
create or replace function public.change_user_role(p_user_id uuid, p_role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_ceo_or_above() then raise exception 'not authorized'; end if;
  delete from public.user_roles where user_id = p_user_id and tenant_id = current_tenant();
  insert into public.user_roles (tenant_id, user_id, role) values (current_tenant(), p_user_id, p_role);
end;
$$;

grant execute on function public.change_user_role(uuid, public.app_role) to authenticated;
