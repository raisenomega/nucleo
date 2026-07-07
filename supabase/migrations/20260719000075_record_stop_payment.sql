-- 20260719000075_record_stop_payment.sql
-- Desacopla cobro de completar: "Cobrar → Guardar" registra el pago (ingreso + montos en la parada)
-- pero NO completa el servicio. Completar es acción aparte (botón verde -> status='Completada').
-- SECURITY DEFINER porque el rol servicio no tiene income.create. Guard anti-doble-cobro.

create or replace function public.record_stop_payment(
  p_stop_id uuid, p_amount numeric, p_payment_method_id uuid default null,
  p_received numeric default null, p_change numeric default null, p_evidence jsonb default '[]'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare _s public.route_stops%rowtype; _r public.service_routes%rowtype; _cat uuid; _pm uuid; _inc uuid;
begin
  select * into _s from public.route_stops where id = p_stop_id;
  if not found then raise exception 'stop not found'; end if;
  select * into _r from public.service_routes where id = _s.route_id;
  if not (public.can_access_module('routes','edit') or _r.created_by = auth.uid() or _r.assigned_to = auth.uid())
    then raise exception 'not authorized'; end if;
  if _s.linked_income_id is not null then raise exception 'Cobro ya registrado'; end if;

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

  update public.route_stops set actual_amount=p_amount, payment_method_id=_pm,
    amount_received=p_received, change_amount=p_change, evidence_urls=p_evidence,
    pending_collection=false, linked_income_id=_inc where id=p_stop_id;
end;
$$;
grant execute on function public.record_stop_payment(uuid, numeric, uuid, numeric, numeric, jsonb) to authenticated;
