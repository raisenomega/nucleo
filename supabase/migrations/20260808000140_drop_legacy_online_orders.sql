-- Migración 140: Consolidación de órdenes — DROP legacy online_orders + confirm_online_order.
-- tenant_landing_orders queda como ÚNICA tabla de órdenes (elimina deuda de schema duplicado).
-- Pre-flight (auditoría #67): online_orders 0 filas · 2 dependencias vivas repointadas a la tabla nueva:
--   (1) get_billing_summary().orders_pending  (2) FK invoices.linked_order_id.
-- next_order_number() y tenant_order_counters se PRESERVAN (agnósticos, sirven a cualquier tabla).

-- 1) Safety net: abortar si la legacy tiene datos
do $$
begin
  if exists (select 1 from public.online_orders limit 1) then
    raise exception 'online_orders no está vacía. Abortar drop.';
  end if;
end $$;

-- 2) Repointar FK invoices.linked_order_id → tenant_landing_orders(id) (columna all-NULL, seguro)
alter table public.invoices drop constraint if exists invoices_linked_order_id_fkey;
alter table public.invoices
  add constraint invoices_linked_order_id_fkey
  foreign key (linked_order_id) references public.tenant_landing_orders(id);

-- 3) Repointar get_billing_summary().orders_pending → tenant_landing_orders (resto idéntico)
create or replace function public.get_billing_summary()
returns jsonb language sql stable security definer set search_path = public as $$
  with g as (select case when public.can_access_module('billing','view') then public.current_tenant() else null end as tid)
  select jsonb_build_object(
    'invoices_pending', (select count(*) from invoices where tenant_id=(select tid from g) and status in ('draft','sent')),
    'invoices_overdue', (select count(*) from invoices where tenant_id=(select tid from g) and status not in ('paid','cancelled') and due_date is not null and due_date < current_date),
    'orders_pending', (select count(*) from tenant_landing_orders where tenant_id=(select tid from g) and status in ('pending','awaiting_payment')),
    'mrr', (select coalesce(sum(case frequency when 'weekly' then amount*52/12 when 'biweekly' then amount*26/12 when 'monthly' then amount when 'quarterly' then amount/3 when 'annual' then amount/12 else 0 end),0)
              from billing_plans where tenant_id=(select tid from g) and status='active')
  );
$$;

-- 4) DROP legacy (idempotente). Ya sin FK entrante ni referencias de función.
drop function if exists public.confirm_online_order(uuid, uuid);
drop table if exists public.online_orders cascade;
