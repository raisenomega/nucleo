-- inventory-phase1 — Reposición + gasto auto + puente landing (bloque 1: migración core).
-- Contexto (auditoría #134): inventory_items sin costo promedio/proveedor/puente landing; movements solo entrada/salida;
-- trigger auto_expense dispara en CUALQUIER movimiento (riesgo doble conteo). Este bloque: enriquece el item, amplía
-- movement_type, agrega RPC record_restock (entrada + avg ponderado + sync landing), y corrige el trigger a SOLO 'entrada'.
-- Decisiones del owner: qty siempre POSITIVA (respeta CHECK quantity>0); gasto en categoría existente 'Inventario';
-- el descuento por venta pública (confirm_landing_order) va en una sesión aparte (bloque 3). record_stop_supplies NO se toca.

-- PARTE 1 — enriquecer inventory_items
alter table public.inventory_items
  add column if not exists sku text,
  add column if not exists avg_cost numeric(12,2) not null default 0,
  add column if not exists last_restock_date timestamptz,
  add column if not exists landing_product_id uuid references public.tenant_landing_products(id) on delete set null,
  add column if not exists supplier_name text,
  add column if not exists notes text;
comment on column public.inventory_items.landing_product_id is 'Puente opcional: si este item es también un producto público';
comment on column public.inventory_items.avg_cost is 'Costo promedio ponderado, recalculado en cada restock';
create unique index if not exists idx_inventory_items_landing_product
  on public.inventory_items(tenant_id, landing_product_id) where landing_product_id is not null;

-- PARTE 2 — ampliar movement_type CHECK (ya es entrada/salida en español) + columnas de enlace
alter table public.inventory_movements drop constraint if exists inventory_movements_movement_type_check;
alter table public.inventory_movements add constraint inventory_movements_movement_type_check
  check (movement_type in ('entrada','salida','ajuste','venta_publica','merma','devolucion'));
alter table public.inventory_movements
  add column if not exists linked_order_id uuid references public.tenant_landing_orders(id) on delete set null,
  add column if not exists linked_restock_id uuid;

-- PARTE 3 — RPC record_restock (entrada + avg ponderado + sync landing product si vinculado)
create or replace function public.record_restock(
  p_item_id uuid, p_quantity numeric, p_unit_cost numeric,
  p_supplier text default null, p_notes text default null, p_date date default current_date
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
  insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date)
    values (_tenant, p_item_id, 'entrada', p_quantity, p_unit_cost, p_notes, auth.uid(), p_date)
    returning id into _mv_id;
  update public.inventory_items set
    stock = stock + p_quantity, avg_cost = round(_new_avg, 2), unit_cost = p_unit_cost,
    last_restock_date = now(), supplier_name = coalesce(p_supplier, supplier_name), updated_at = now()
  where id = p_item_id and tenant_id = _tenant;
  if _item.landing_product_id is not null then
    update public.tenant_landing_products set stock_quantity = _item.stock + p_quantity, updated_at = now()
    where id = _item.landing_product_id and tenant_id = _tenant;
  end if;
  return _mv_id;
end $$;

-- PARTE 4 — corregir trigger: SOLO 'entrada' crea gasto (evita doble conteo con salidas/consumo de ruta).
create or replace function public.auto_expense_on_inventory_entry()
 returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare _cat uuid; _pm uuid; _name text; _amt numeric;
begin
  _amt := coalesce(NEW.quantity, 0) * coalesce(NEW.unit_cost, 0);
  if NEW.movement_type <> 'entrada' or _amt <= 0 then return NEW; end if;
  select name into _name from public.inventory_items where id = NEW.item_id;
  select id into _cat from public.categories
    where tenant_id = NEW.tenant_id and kind = 'expense' and label = 'Inventario' limit 1;
  if _cat is null then insert into public.categories(tenant_id, kind, label, expense_class, sort)
    values (NEW.tenant_id, 'expense', 'Inventario', 'variable', 80) returning id into _cat; end if;
  select id into _pm from public.categories
    where tenant_id = NEW.tenant_id and kind = 'payment_method' and label = 'Efectivo' limit 1;
  if _pm is null then insert into public.categories(tenant_id, kind, label, sort)
    values (NEW.tenant_id, 'payment_method', 'Efectivo', 90) returning id into _pm; end if;
  insert into public.expenses(tenant_id, category_id, payment_method_id, amount, expense_date, notes, linked_inventory_movement_id, created_by)
    values (NEW.tenant_id, _cat, _pm, _amt, NEW.movement_date,
      'Compra inventario: ' || coalesce(_name, '') || ' ×' || NEW.quantity, NEW.id, NEW.created_by);
  return NEW;
end $function$;
