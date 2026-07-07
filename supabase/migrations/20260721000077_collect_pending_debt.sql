-- 20260721000077_collect_pending_debt.sql
-- Cobrar una deuda pendiente: genera ingreso por el monto estimado + limpia el flag pending_collection.
-- SECURITY DEFINER (el ingreso lo crea aunque el rol no tenga income.create). Guard: debe haber deuda.
-- Perdonar deuda NO va aquí: es un update simple (pending_collection=false + notes) que hace coo/ceo.

create or replace function public.collect_pending_debt(p_stop_id uuid, p_method_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare _s public.route_stops%rowtype; _r public.service_routes%rowtype; _cat uuid; _pm uuid; _inc uuid;
begin
  select * into _s from public.route_stops where id = p_stop_id;
  if not found then raise exception 'stop not found'; end if;
  select * into _r from public.service_routes where id = _s.route_id;
  if _r.tenant_id <> current_tenant() then raise exception 'not found'; end if;
  if not (public.can_access_module('accounts_receivable','edit') or public.can_access_module('routes','edit'))
    then raise exception 'not authorized'; end if;
  if not _s.pending_collection then raise exception 'Sin deuda pendiente'; end if;

  _pm := p_method_id;
  if _pm is null then
    select id into _pm from public.categories where tenant_id = current_tenant() and kind='payment_method' and label='Efectivo' limit 1;
    if _pm is null then insert into public.categories(tenant_id,kind,label,sort) values (current_tenant(),'payment_method','Efectivo',90) returning id into _pm; end if;
  end if;
  select id into _cat from public.categories where tenant_id = current_tenant() and kind='income' and label='Servicio de ruta' limit 1;
  if _cat is null then insert into public.categories(tenant_id,kind,label,sort) values (current_tenant(),'income','Servicio de ruta',90) returning id into _cat; end if;

  insert into public.income(tenant_id,category_id,payment_method_id,amount,income_date,notes,created_by)
    values (current_tenant(),_cat,_pm,coalesce(_s.estimated_amount,0),current_date,
      'Cobro de deuda: '||coalesce(_s.client_name,'')||' - '||coalesce(_s.service_type,''), auth.uid())
    returning id into _inc;

  update public.route_stops set pending_collection=false, actual_amount=coalesce(estimated_amount,0),
    payment_method_id=_pm, linked_income_id=_inc where id=p_stop_id;
end;
$$;
grant execute on function public.collect_pending_debt(uuid, uuid) to authenticated;
