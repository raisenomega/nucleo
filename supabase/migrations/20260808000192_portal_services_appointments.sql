-- Portal P3 — servicios (route_stops por teléfono, best-effort), citas (appointments via lead.email) + reorder.
-- ADITIVO: no altera policies/RPCs del staff. route_stops no tiene email/customer_id → match por teléfono normalizado.

create policy rs_customer_select on public.route_stops for select using (
  exists (
    select 1 from public.customer_profiles cp
    where cp.user_id = auth.uid() and cp.tenant_id = route_stops.tenant_id
      and nullif(regexp_replace(coalesce(cp.phone,''), '\D', '', 'g'), '') is not null
      and regexp_replace(coalesce(cp.phone,''), '\D', '', 'g') = regexp_replace(coalesce(route_stops.phone,''), '\D', '', 'g')
  )
);

-- Citas: el cliente ve las de los leads con su email (en su tenant).
create policy appt_customer_select on public.appointments for select using (
  exists (select 1 from public.leads l where l.id = appointments.lead_id and l.tenant_id = appointments.tenant_id and l.email = auth.email())
  and exists (select 1 from public.customer_profiles cp where cp.user_id = auth.uid() and cp.tenant_id = appointments.tenant_id)
);

create or replace function public._customer_appointment(_id uuid)
  returns public.appointments language sql stable security definer set search_path to 'public' as $$
  select a.* from public.appointments a
  where a.id = _id
    and exists (select 1 from public.leads l where l.id = a.lead_id and l.tenant_id = a.tenant_id and l.email = auth.email())
    and exists (select 1 from public.customer_profiles cp where cp.user_id = auth.uid() and cp.tenant_id = a.tenant_id);
$$;

-- Reagendar: nueva fecha/hora (valida ends>starts como el CHECK). No permitido si completada/cancelada.
create or replace function public.customer_reschedule_appointment(_id uuid, _starts timestamptz, _ends timestamptz)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _a public.appointments;
begin
  select * into _a from public._customer_appointment(_id);
  if _a.id is null then return jsonb_build_object('status','error','code','not_found'); end if;
  if _a.status in ('completada','cancelada') then return jsonb_build_object('status','error','code','invalid_status'); end if;
  if _ends <= _starts then return jsonb_build_object('status','error','code','bad_range'); end if;
  update public.appointments set starts_at=_starts, ends_at=_ends, status='agendada', updated_at=now() where id=_id;
  return jsonb_build_object('status','ok');
end $$;

create or replace function public.customer_cancel_appointment(_id uuid)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _a public.appointments;
begin
  select * into _a from public._customer_appointment(_id);
  if _a.id is null then return jsonb_build_object('status','error','code','not_found'); end if;
  update public.appointments set status='cancelada', updated_at=now() where id=_id;
  return jsonb_build_object('status','ok');
end $$;

-- Reorder: clona los ítems/totales de una orden del cliente (reusa _customer_order de la migr 191) en una nueva 'pending'.
create or replace function public.customer_reorder(_order_id uuid)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _o public.tenant_landing_orders; _new uuid;
begin
  select * into _o from public._customer_order(_order_id);
  if _o.id is null then return jsonb_build_object('status','error','code','not_found'); end if;
  insert into public.tenant_landing_orders(tenant_id, order_number, customer_name, customer_email, customer_phone, customer_address,
    items, subtotal, tax, shipping, discount, total, currency, status, payment_status, order_type, notes)
  values(_o.tenant_id, public.next_order_number(_o.tenant_id), _o.customer_name, _o.customer_email, _o.customer_phone, _o.customer_address,
    _o.items, _o.subtotal, coalesce(_o.tax,0), coalesce(_o.shipping,0), coalesce(_o.discount,0), _o.total, _o.currency, 'pending', 'pending', _o.order_type,
    'Reorden del '||coalesce(_o.order_number,'')) returning id into _new;
  return jsonb_build_object('status','ok','order_id',_new);
end $$;

grant execute on function public.customer_reschedule_appointment(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.customer_cancel_appointment(uuid) to authenticated;
grant execute on function public.customer_reorder(uuid) to authenticated;
