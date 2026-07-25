-- GL · RPC de activación (Ola 3 · Sesión C5)
-- set_gl_enabled: wrapper gateado por CEO. Al activar, seedea el plan de cuentas si falta.
create or replace function public.set_gl_enabled(p_enabled boolean)
returns boolean language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant();
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  if p_enabled and not exists (select 1 from public.chart_of_accounts where tenant_id = _t) then
    perform public._seed_chart_of_accounts(_t);
  end if;
  update public.tenants set gl_enabled = p_enabled where id = _t;
  return p_enabled;
end $function$;
grant execute on function public.set_gl_enabled(boolean) to authenticated;
