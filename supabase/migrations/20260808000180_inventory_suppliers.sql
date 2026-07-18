-- inventory-phase2 — proveedores como entidad + supplier_id en items/movimientos + record_restock con supplier_id.
-- No hay supplier_name poblado (0 filas) → sin migración de datos. RLS: select por tenant, gestión ceo+. record_restock
-- gana p_supplier_id (opcional): lo guarda en el movimiento y en el item; p_supplier text sigue como fallback (supplier_name).

create table if not exists public.inventory_suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant() references public.tenants(id) on delete cascade,
  name text not null,
  contact_name text, phone text, email text, address text,
  lead_time_days int, payment_terms text, notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);
create index if not exists idx_inventory_suppliers_tenant on public.inventory_suppliers(tenant_id, is_active);
alter table public.inventory_suppliers enable row level security;
create policy inventory_suppliers_select on public.inventory_suppliers for select using (tenant_id = current_tenant());
create policy inventory_suppliers_all on public.inventory_suppliers for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
drop trigger if exists trg_inventory_suppliers_updated on public.inventory_suppliers;
create trigger trg_inventory_suppliers_updated before update on public.inventory_suppliers
  for each row execute function public.set_updated_at();

alter table public.inventory_items add column if not exists supplier_id uuid references public.inventory_suppliers(id) on delete set null;
alter table public.inventory_movements add column if not exists supplier_id uuid references public.inventory_suppliers(id) on delete set null;

drop function if exists public.record_restock(uuid, numeric, numeric, text, text, date);
create or replace function public.record_restock(
  p_item_id uuid, p_quantity numeric, p_unit_cost numeric,
  p_supplier text default null, p_notes text default null, p_date date default current_date, p_supplier_id uuid default null
) returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
  _tenant uuid := current_tenant();
  _item public.inventory_items%rowtype;
  _mv_id uuid; _base_avg numeric; _new_avg numeric;
begin
  if p_quantity is null or p_quantity <= 0 then raise exception 'Cantidad inválida'; end if;
  if p_unit_cost is null or p_unit_cost < 0 then raise exception 'Costo inválido'; end if;
  select * into _item from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  _base_avg := coalesce(nullif(_item.avg_cost, 0), nullif(_item.unit_cost, 0), p_unit_cost);
  _new_avg := case when _item.stock + p_quantity > 0
    then ((_base_avg * _item.stock) + (p_unit_cost * p_quantity)) / (_item.stock + p_quantity)
    else p_unit_cost end;
  insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, supplier_id)
    values (_tenant, p_item_id, 'entrada', p_quantity, p_unit_cost, p_notes, auth.uid(), p_date, p_supplier_id)
    returning id into _mv_id;
  update public.inventory_items set
    stock = stock + p_quantity, avg_cost = round(_new_avg, 2), unit_cost = p_unit_cost,
    last_restock_date = now(), supplier_name = coalesce(p_supplier, supplier_name),
    supplier_id = coalesce(p_supplier_id, supplier_id), updated_at = now()
  where id = p_item_id and tenant_id = _tenant;
  if _item.landing_product_id is not null then
    update public.tenant_landing_products set stock_quantity = _item.stock + p_quantity, updated_at = now()
    where id = _item.landing_product_id and tenant_id = _tenant;
  end if;
  return _mv_id;
end $$;
