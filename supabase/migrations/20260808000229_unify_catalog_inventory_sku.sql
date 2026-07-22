-- 229 · Ola 2.2a · Unificar catálogo ↔ inventario + SKU real.
--
-- Los productos vendibles (tenant_landing_products) con track_inventory ganan un inventory_item enlazado
-- (landing_product_id) con SKU. 100% ADITIVO: NO toca confirm_landing_order / record_restock /
-- receive_purchase_order / auto_expense_on_inventory_entry. Al poblar el FK, el descuento de stock de la venta
-- (que YA lee landing_product_id) empieza a operar de verdad. Fuente de verdad = inventory_items.stock;
-- tenant_landing_products.stock_quantity es el espejo (lo mantiene confirm_landing_order/record_restock).
--
-- DECISIÓN: unit_cost/avg_cost inicial = 0 (NO el price). El price es de VENTA, no costo; usarlo como costo
-- corrompería el COGS/valuación (2.2b). El costo real lo fija el primer restock (record_restock recalcula avg).

-- 1. SKU único por tenant (donde tenga valor). Hoy 0 items con SKU → sin colisión.
create unique index if not exists uq_inventory_items_sku
  on public.inventory_items (tenant_id, sku) where sku is not null and sku <> '';

-- 2. Generador de SKU: base de 3 alfanum del nombre + secuencia, robusto ante colisión.
create or replace function public._generate_sku(_tenant uuid, _name text)
returns text language plpgsql security definer set search_path = public as $$
declare _base text; _seq int; _sku text;
begin
  _base := upper(regexp_replace(substring(coalesce(nullif(trim(_name),''),'ITM') from 1 for 3), '[^A-Za-z0-9]', 'X', 'g'));
  _base := rpad(_base, 3, 'X');
  _seq := coalesce((select max(substring(sku from '\d+$')::int) from public.inventory_items
                    where tenant_id = _tenant and sku like _base || '-%' and sku ~ (_base || '-\d+$')), 0);
  loop
    _seq := _seq + 1;
    _sku := _base || '-' || lpad(_seq::text, 4, '0');
    exit when not exists (select 1 from public.inventory_items where tenant_id = _tenant and sku = _sku);
  end loop;
  return _sku;
end $$;
revoke execute on function public._generate_sku(uuid, text) from public, anon, authenticated;

-- 3. Enlazar/crear inventory_item para un producto del catálogo (idempotente).
create or replace function public.link_product_to_inventory(_product_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _tenant uuid := current_tenant(); _prod record; _item_id uuid; _sku text;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  select * into _prod from public.tenant_landing_products where id = _product_id and tenant_id = _tenant;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  select id into _item_id from public.inventory_items where tenant_id = _tenant and landing_product_id = _product_id;
  if _item_id is not null then return jsonb_build_object('status','ok','item_id',_item_id,'already_linked',true); end if;
  _sku := nullif(trim(_prod.sku), '');
  if _sku is null or exists (select 1 from public.inventory_items where tenant_id = _tenant and sku = _sku)
    then _sku := public._generate_sku(_tenant, _prod.name); end if;
  insert into public.inventory_items (tenant_id, name, sku, stock, min_stock, landing_product_id, unit_cost, avg_cost)
    values (_tenant, _prod.name, _sku, coalesce(_prod.stock_quantity,0), coalesce(_prod.low_stock_threshold,0), _product_id, 0, 0)
    returning id into _item_id;
  update public.tenant_landing_products set sku = _sku where id = _product_id and (sku is null or trim(sku) = '');
  return jsonb_build_object('status','ok','item_id',_item_id,'sku',_sku,'already_linked',false);
end $$;
grant execute on function public.link_product_to_inventory(uuid) to authenticated;

-- 4. Backfill: enlaza los productos con track_inventory que no tengan item (cross-tenant, sin gate = setup trusted).
do $$
declare _p record; _sku text;
begin
  for _p in select tp.id, tp.tenant_id, tp.name, tp.sku, tp.stock_quantity, tp.low_stock_threshold
            from public.tenant_landing_products tp
            where tp.track_inventory = true
              and not exists (select 1 from public.inventory_items ii where ii.landing_product_id = tp.id and ii.tenant_id = tp.tenant_id)
  loop
    _sku := nullif(trim(_p.sku), '');
    if _sku is null or exists (select 1 from public.inventory_items where tenant_id = _p.tenant_id and sku = _sku)
      then _sku := public._generate_sku(_p.tenant_id, _p.name); end if;
    insert into public.inventory_items (tenant_id, name, sku, stock, min_stock, landing_product_id, unit_cost, avg_cost)
      values (_p.tenant_id, _p.name, _sku, coalesce(_p.stock_quantity,0), coalesce(_p.low_stock_threshold,0), _p.id, 0, 0);
    update public.tenant_landing_products set sku = _sku where id = _p.id and (sku is null or trim(sku) = '');
  end loop;
end $$;
