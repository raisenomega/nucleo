-- linked_income_id YA existe en route_stops -> sin ALTER. Solo el RPC atómico.
-- Completa una parada: autoriza (routes.edit o creador/asignado) -> crea ingreso (SECURITY DEFINER
-- evita la RLS de income, que servicio no tiene) -> marca la parada + enlaza. Si todas completas, ruta completa.
create or replace function public.complete_route_stop(p_stop_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _s public.route_stops%rowtype; _r public.service_routes%rowtype; _cat uuid; _pm uuid; _inc uuid; _pend int;
begin
  select * into _s from public.route_stops where id = p_stop_id;
  if not found then raise exception 'stop not found'; end if;
  select * into _r from public.service_routes where id = _s.route_id;
  if not (public.can_access_module('routes','edit') or _r.created_by = auth.uid() or _r.assigned_to = auth.uid())
    then raise exception 'not authorized'; end if;
  if _s.status = 'Completada' then raise exception 'already completed'; end if;

  if coalesce(_s.estimated_amount, 0) > 0 then
    select id into _cat from public.categories where tenant_id = current_tenant() and kind = 'income' and label = 'Servicio de ruta' limit 1;
    if _cat is null then insert into public.categories (tenant_id, kind, label, sort) values (current_tenant(),'income','Servicio de ruta',90) returning id into _cat; end if;
    select id into _pm from public.categories where tenant_id = current_tenant() and kind = 'payment_method' and label = 'Efectivo' limit 1;
    if _pm is null then insert into public.categories (tenant_id, kind, label, sort) values (current_tenant(),'payment_method','Efectivo',90) returning id into _pm; end if;
    insert into public.income (tenant_id, category_id, payment_method_id, amount, income_date, notes, created_by)
      values (current_tenant(), _cat, _pm, _s.estimated_amount, _r.route_date,
        'Ruta: ' || coalesce(_s.client_name,'') || ' - ' || coalesce(_s.service_type,''), auth.uid())
      returning id into _inc;
  end if;

  update public.route_stops set status = 'Completada', actual_amount = _s.estimated_amount,
    completed_at = now(), linked_income_id = _inc where id = p_stop_id;

  select count(*) into _pend from public.route_stops where route_id = _s.route_id and status <> 'Completada';
  if _pend = 0 then update public.service_routes set status = 'Completada' where id = _s.route_id; end if;
end;
$$;
grant execute on function public.complete_route_stop(uuid) to authenticated;
