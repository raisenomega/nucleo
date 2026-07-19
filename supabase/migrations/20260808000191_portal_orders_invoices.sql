-- Portal P2 — acceso del customer a SUS órdenes/facturas + acciones (confirmar pago ATH / cancelar).
-- ADITIVO: no altera policies/RPCs del staff. Propiedad = customer_email = auth.email() + perfil en el tenant del order.

-- RLS SELECT del customer (OR con las policies de staff existentes; no las modifica).
create policy tlo_customer_select on public.tenant_landing_orders for select using (
  customer_email = auth.email()
  and exists (select 1 from public.customer_profiles cp where cp.user_id = auth.uid() and cp.tenant_id = tenant_landing_orders.tenant_id)
);
create policy inv_customer_select on public.invoices for select using (
  linked_order_id in (
    select o.id from public.tenant_landing_orders o
    where o.customer_email = auth.email()
      and exists (select 1 from public.customer_profiles cp where cp.user_id = auth.uid() and cp.tenant_id = o.tenant_id)
  )
);

-- Órden del customer logueado (o vacío). Valida email + perfil en el tenant. Base de las acciones.
create or replace function public._customer_order(_order_id uuid)
  returns public.tenant_landing_orders language sql stable security definer set search_path to 'public' as $$
  select o.* from public.tenant_landing_orders o
  where o.id = _order_id and o.customer_email = auth.email()
    and exists (select 1 from public.customer_profiles cp where cp.user_id = auth.uid() and cp.tenant_id = o.tenant_id);
$$;

-- El cliente marca que pagó (ATH): pending/awaiting_payment → awaiting_confirmation. Dispara la notif al negocio (trigger existente).
create or replace function public.customer_confirm_payment(_order_id uuid)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _o public.tenant_landing_orders;
begin
  select * into _o from public._customer_order(_order_id);
  if _o.id is null then return jsonb_build_object('status','error','code','not_found'); end if;
  if _o.status not in ('pending','awaiting_payment') then return jsonb_build_object('status','error','code','invalid_status'); end if;
  perform set_config('app.order_note','Cliente confirmó pago (portal)', true);
  update public.tenant_landing_orders set status='awaiting_confirmation', client_confirmed_at=now(), updated_at=now() where id=_order_id;
  return jsonb_build_object('status','ok');
end $$;

-- El cliente cancela una orden aún no pagada (pending o awaiting_payment).
create or replace function public.customer_cancel_order(_order_id uuid)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _o public.tenant_landing_orders;
begin
  select * into _o from public._customer_order(_order_id);
  if _o.id is null then return jsonb_build_object('status','error','code','not_found'); end if;
  if _o.status not in ('pending','awaiting_payment') then return jsonb_build_object('status','error','code','invalid_status'); end if;
  perform set_config('app.order_note','Cliente canceló (portal)', true);
  update public.tenant_landing_orders set status='canceled', updated_at=now() where id=_order_id;
  return jsonb_build_object('status','ok');
end $$;

grant execute on function public.customer_confirm_payment(uuid) to authenticated;
grant execute on function public.customer_cancel_order(uuid) to authenticated;
