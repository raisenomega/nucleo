-- inventory-phase3 — órdenes de compra + recepción parcial + transferencias + reorder points.
-- No toca record_restock (lo LLAMA y linkea el movimiento después). transferencia no crea gasto (trigger solo 'entrada').

alter table public.inventory_items
  add column if not exists reorder_point int,
  add column if not exists reorder_qty int;
comment on column public.inventory_items.reorder_point is 'Cuando stock llega a este nivel, generar alerta de reorden';
comment on column public.inventory_items.reorder_qty is 'Cantidad sugerida a pedir cuando se alcanza reorder_point';

alter table public.inventory_movements drop constraint if exists inventory_movements_movement_type_check;
alter table public.inventory_movements add constraint inventory_movements_movement_type_check
  check (movement_type in ('entrada','salida','ajuste','venta_publica','merma','devolucion','transferencia'));

create table if not exists public.inventory_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant() references public.tenants(id) on delete cascade,
  order_number serial,
  supplier_id uuid references public.inventory_suppliers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','ordered','partial','received','cancelled')),
  ordered_at timestamptz, expected_at timestamptz, received_at timestamptz,
  total_cost numeric(10,2) default 0, notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.inventory_purchase_orders enable row level security;
create policy po_select on public.inventory_purchase_orders for select using (tenant_id = current_tenant());
create policy po_all on public.inventory_purchase_orders for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
drop trigger if exists trg_po_updated on public.inventory_purchase_orders;
create trigger trg_po_updated before update on public.inventory_purchase_orders for each row execute function public.set_updated_at();

create table if not exists public.inventory_purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.inventory_purchase_orders(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity int not null check (quantity > 0),
  unit_cost numeric(10,2) not null,
  received_qty int default 0,
  tenant_id uuid not null default current_tenant() references public.tenants(id) on delete cascade,
  unique (order_id, item_id)
);
alter table public.inventory_purchase_order_items enable row level security;
create policy poi_select on public.inventory_purchase_order_items for select using (tenant_id = current_tenant());
create policy poi_all on public.inventory_purchase_order_items for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());

-- RPC transfer_stock: mueve ubicación (no cambia stock total). qty positiva.
create or replace function public.transfer_stock(p_item_id uuid, p_qty numeric, p_zone text, p_aisle text, p_shelf text, p_bin text, p_notes text default null)
 returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _tenant uuid := current_tenant(); _item public.inventory_items%rowtype; _mv uuid; _from text; _to text;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'Cantidad inválida'; end if;
  select * into _item from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  _from := coalesce(nullif(concat_ws('-', _item.aisle, _item.shelf, _item.bin), ''), '—');
  _to := coalesce(nullif(concat_ws('-', p_aisle, p_shelf, p_bin), ''), '—');
  insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date)
    values(_tenant, p_item_id, 'transferencia', p_qty, coalesce(_item.avg_cost, 0), trim(coalesce(p_notes,'') || ' ' || _from || ' → ' || _to), auth.uid(), current_date) returning id into _mv;
  update public.inventory_items set warehouse_zone = p_zone, aisle = p_aisle, shelf = p_shelf, bin = p_bin, updated_at = now() where id = p_item_id and tenant_id = _tenant;
  return _mv;
end $$;

-- RPC receive_purchase_order: recibe (parcial) → record_restock por item (stock+gasto+avg) + linkea movimiento; ajusta estado.
create or replace function public.receive_purchase_order(p_order_id uuid, p_items jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _tenant uuid := current_tenant(); _po public.inventory_purchase_orders%rowtype;
        _it jsonb; _item_id uuid; _rq numeric; _cost numeric; _mv uuid; _all boolean;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select * into _po from public.inventory_purchase_orders where id = p_order_id and tenant_id = _tenant for update;
  if not found then raise exception 'Orden no encontrada'; end if;
  for _it in select * from jsonb_array_elements(p_items) loop
    _item_id := (_it->>'item_id')::uuid; _rq := coalesce((_it->>'received_qty')::numeric, 0);
    if _rq <= 0 then continue; end if;
    select unit_cost into _cost from public.inventory_purchase_order_items where order_id = p_order_id and item_id = _item_id;
    if _cost is null then continue; end if;
    update public.inventory_purchase_order_items set received_qty = received_qty + _rq where order_id = p_order_id and item_id = _item_id;
    _mv := public.record_restock(_item_id, _rq, _cost, null, 'Recepción PO', current_date, _po.supplier_id);
    update public.inventory_movements set linked_restock_id = p_order_id where id = _mv;
  end loop;
  select bool_and(received_qty >= quantity) into _all from public.inventory_purchase_order_items where order_id = p_order_id;
  update public.inventory_purchase_orders set status = case when _all then 'received' else 'partial' end,
    received_at = case when _all then now() else received_at end, updated_at = now() where id = p_order_id;
  return jsonb_build_object('status', case when _all then 'received' else 'partial' end);
end $$;

-- RPC generate_reorder_suggestions: items con stock <= reorder_point y reorder_qty > 0.
create or replace function public.generate_reorder_suggestions()
 returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(jsonb_build_object('item_id', i.id, 'name', i.name, 'stock', i.stock,
    'reorder_point', i.reorder_point, 'reorder_qty', i.reorder_qty, 'supplier_id', i.supplier_id,
    'supplier_name', s.name, 'unit_cost', coalesce(nullif(i.avg_cost, 0), i.unit_cost, 0)) order by i.name), '[]'::jsonb)
  from public.inventory_items i left join public.inventory_suppliers s on s.id = i.supplier_id
  where i.tenant_id = current_tenant() and i.reorder_point is not null and i.stock <= i.reorder_point and coalesce(i.reorder_qty, 0) > 0;
$$;
