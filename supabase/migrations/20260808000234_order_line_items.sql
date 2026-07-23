-- 234 · Ola 2.3d · Líneas de orden normalizadas (cierra la normalización de las 3 entidades de venta).
--
-- El jsonb de tenant_landing_orders tiene formato DISTINTO a invoices/quotes: {id, qty, kind, name} — con el id
-- del catálogo pero SIN precio por línea (el precio se computa server-side y vive en subtotal/total de la orden;
-- pricing_breakdown solo trae el agregado, no por ítem). Por eso el trigger lee item->>'id' (cuando kind='product')
-- y deja unit_price/line_total NULL (NO se inventan precios). Mismo modelo dual: el jsonb es la fuente única
-- (lo usa confirm_landing_order para descontar stock — NO se toca); las líneas son proyección por trigger.

create table if not exists public.order_line_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  order_id uuid not null references public.tenant_landing_orders(id) on delete cascade,
  product_id uuid references public.tenant_landing_products(id) on delete set null,
  kind text,
  description text not null default '',
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2),  -- NULLABLE: las órdenes no tienen precio por línea
  line_total numeric(12,2),  -- NULLABLE por lo mismo
  sort int not null default 0,
  created_at timestamptz not null default now());
create index if not exists idx_order_line_items_order on public.order_line_items (order_id);
create index if not exists idx_order_line_items_product on public.order_line_items (product_id) where product_id is not null;

alter table public.order_line_items enable row level security;
drop policy if exists oli_select on public.order_line_items;
create policy oli_select on public.order_line_items for select using (tenant_id = public.current_tenant());

-- Trigger: proyecta el jsonb → líneas. product_id = item.id SOLO si kind='product' y existe en el catálogo del tenant.
create or replace function public._sync_order_lines() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.order_line_items where order_id = new.id;
  insert into public.order_line_items (tenant_id, order_id, product_id, kind, description, quantity, sort)
  select new.tenant_id, new.id,
    case when item->>'kind' = 'product'
      and exists (select 1 from public.tenant_landing_products p where p.id = (item->>'id')::uuid and p.tenant_id = new.tenant_id)
      then (item->>'id')::uuid else null end,
    item->>'kind', coalesce(item->>'name', ''), coalesce((item->>'qty')::numeric, 1), (ord - 1)::int
  from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) with ordinality as t(item, ord);
  return new;
end $$;
drop trigger if exists trg_sync_order_lines on public.tenant_landing_orders;
create trigger trg_sync_order_lines after insert or update of items on public.tenant_landing_orders
  for each row execute function public._sync_order_lines();

-- Backfill de las 6 órdenes existentes.
insert into public.order_line_items (tenant_id, order_id, product_id, kind, description, quantity, sort)
select o.tenant_id, o.id,
  case when item->>'kind' = 'product'
    and exists (select 1 from public.tenant_landing_products p where p.id = (item->>'id')::uuid and p.tenant_id = o.tenant_id)
    then (item->>'id')::uuid else null end,
  item->>'kind', coalesce(item->>'name', ''), coalesce((item->>'qty')::numeric, 1), (ord - 1)::int
from public.tenant_landing_orders o, jsonb_array_elements(o.items) with ordinality as t(item, ord)
where o.items is not null and jsonb_array_length(o.items) > 0
  and not exists (select 1 from public.order_line_items l where l.order_id = o.id);
