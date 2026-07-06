-- payment_method_id / actual_amount / linked_income_id YA existen (00006). Faltan estas 5:
alter table public.route_stops add column phone text;
alter table public.route_stops add column evidence_urls jsonb default '[]'::jsonb;
alter table public.route_stops add column amount_received numeric(12,2);
alter table public.route_stops add column change_amount numeric(12,2);
alter table public.route_stops add column pending_collection boolean default false;

-- Cobro ampliado: monto real, método, recibido, cambio, evidencia. Ruta completa si no quedan 'Pendiente'.
drop function if exists public.complete_route_stop(uuid);
create or replace function public.complete_route_stop(
  p_stop_id uuid, p_amount numeric, p_payment_method_id uuid default null,
  p_received numeric default null, p_change numeric default null, p_evidence jsonb default '[]'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare _s public.route_stops%rowtype; _r public.service_routes%rowtype; _cat uuid; _pm uuid; _inc uuid; _pend int;
begin
  select * into _s from public.route_stops where id = p_stop_id;
  if not found then raise exception 'stop not found'; end if;
  select * into _r from public.service_routes where id = _s.route_id;
  if not (public.can_access_module('routes','edit') or _r.created_by = auth.uid() or _r.assigned_to = auth.uid())
    then raise exception 'not authorized'; end if;
  if _s.status = 'Completada' then raise exception 'already completed'; end if;

  _pm := p_payment_method_id;
  if _pm is null then
    select id into _pm from public.categories where tenant_id = current_tenant() and kind = 'payment_method' and label = 'Efectivo' limit 1;
    if _pm is null then insert into public.categories(tenant_id,kind,label,sort) values (current_tenant(),'payment_method','Efectivo',90) returning id into _pm; end if;
  end if;
  if coalesce(p_amount,0) > 0 then
    select id into _cat from public.categories where tenant_id = current_tenant() and kind = 'income' and label = 'Servicio de ruta' limit 1;
    if _cat is null then insert into public.categories(tenant_id,kind,label,sort) values (current_tenant(),'income','Servicio de ruta',90) returning id into _cat; end if;
    insert into public.income(tenant_id,category_id,payment_method_id,amount,income_date,notes,evidence_urls,created_by)
      values (current_tenant(),_cat,_pm,p_amount,_r.route_date,
        'Ruta: '||coalesce(_s.client_name,'')||' - '||coalesce(_s.service_type,''), p_evidence, auth.uid())
      returning id into _inc;
  end if;

  update public.route_stops set status='Completada', actual_amount=p_amount, payment_method_id=_pm,
    amount_received=p_received, change_amount=p_change, evidence_urls=p_evidence, pending_collection=false,
    completed_at=now(), linked_income_id=_inc where id=p_stop_id;
  select count(*) into _pend from public.route_stops where route_id=_s.route_id and status='Pendiente';
  if _pend=0 then update public.service_routes set status='Completada' where id=_s.route_id; end if;
end;
$$;
grant execute on function public.complete_route_stop(uuid, numeric, uuid, numeric, numeric, jsonb) to authenticated;

-- No atendido: guarda razón + marca deuda pendiente (si hay monto). La ruta puede completarse igual.
create or replace function public.set_stop_not_attended(p_stop_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare _s public.route_stops%rowtype; _r public.service_routes%rowtype; _pend int;
begin
  select * into _s from public.route_stops where id = p_stop_id;
  if not found then raise exception 'stop not found'; end if;
  select * into _r from public.service_routes where id = _s.route_id;
  if not (public.can_access_module('routes','edit') or _r.created_by = auth.uid() or _r.assigned_to = auth.uid())
    then raise exception 'not authorized'; end if;
  update public.route_stops set status='No atendido', notes=p_reason,
    pending_collection=(coalesce(_s.estimated_amount,0) > 0) where id=p_stop_id;
  select count(*) into _pend from public.route_stops where route_id=_s.route_id and status='Pendiente';
  if _pend=0 then update public.service_routes set status='Completada' where id=_s.route_id; end if;
end;
$$;
grant execute on function public.set_stop_not_attended(uuid, text) to authenticated;
