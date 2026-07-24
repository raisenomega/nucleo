-- 20260808000260 · Inventory Gap Fix #6 — Multi-almacén REAL (Parte 1: backend)
-- Patrón SAP/Oracle: inventory_items.stock = TOTAL; inventory_stock = desglose por (item × almacén).
-- Backward compatible: p_warehouse_id DEFAULT NULL en las RPCs → resuelve al almacén default del tenant.
-- Los 4 campos de ubicación de inventory_items quedan legacy (el frontend migra en la Parte 2).
-- DECISIÓN: transfer_stock(7-arg) se conserva intacto para NO romper el "Reubicar" desplegado; se AÑADE
--   un overload transfer_stock(5-arg) para el transfer real entre almacenes (la Parte 2 dropea el viejo).

-- ── TABLAS ───────────────────────────────────────────────────────────────────────────────────────────
create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, code text not null, address text,
  is_default boolean not null default false, is_active boolean not null default true, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now(), deleted_at timestamptz,
  unique (tenant_id, code)
);
create unique index warehouses_one_default_per_tenant on public.warehouses (tenant_id) where is_default = true and deleted_at is null;

create table public.inventory_stock (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  quantity numeric not null default 0,
  min_stock numeric default 0, reorder_point numeric default 0, reorder_qty numeric default 0,
  location_zone text, location_aisle text, location_shelf text, location_bin text,
  updated_at timestamptz default now(),
  unique (item_id, warehouse_id)
);

alter table public.inventory_movements add column if not exists warehouse_id uuid references public.warehouses(id);
alter table public.inventory_movements add column if not exists to_warehouse_id uuid references public.warehouses(id);
alter table public.inventory_count_lines add column if not exists warehouse_id uuid references public.warehouses(id);

-- ── RLS (espejo de inventory_items; escritura gateada por inventory:edit) ─────────────────────────────
alter table public.warehouses enable row level security;
alter table public.inventory_stock enable row level security;
create policy warehouses_select on public.warehouses for select to authenticated using (tenant_id = current_tenant());
create policy warehouses_insert on public.warehouses for insert to authenticated with check (tenant_id = current_tenant() and can_access_module('inventory','edit'));
create policy warehouses_update on public.warehouses for update to authenticated using (tenant_id = current_tenant() and can_access_module('inventory','edit'));
create policy warehouses_delete on public.warehouses for delete to authenticated using (tenant_id = current_tenant() and can_access_module('inventory','delete'));
create policy inv_stock_select on public.inventory_stock for select to authenticated using (tenant_id = current_tenant());
create policy inv_stock_insert on public.inventory_stock for insert to authenticated with check (tenant_id = current_tenant() and can_access_module('inventory','edit'));
create policy inv_stock_update on public.inventory_stock for update to authenticated using (tenant_id = current_tenant() and can_access_module('inventory','edit'));
-- inventory_stock sin política DELETE: se borra solo por CASCADE del ítem/almacén.
create trigger trg_updated_at before update on public.warehouses for each row execute function public.set_updated_at();

-- ── HELPERS ──────────────────────────────────────────────────────────────────────────────────────────
create or replace function public._default_warehouse(_tenant uuid) returns uuid language sql stable security definer set search_path to 'public' as $$
  select id from public.warehouses where tenant_id = _tenant and is_default and deleted_at is null limit 1;
$$;

-- Total del ítem = Σ de todos sus almacenes; sincroniza el mirror del catálogo público.
create or replace function public._recalc_item_total_stock(p_item_id uuid) returns void language sql security definer set search_path to 'public' as $$
  update public.inventory_items set stock = coalesce((select sum(quantity) from public.inventory_stock where item_id = p_item_id), 0), updated_at = now() where id = p_item_id;
  update public.tenant_landing_products p set stock_quantity = i.stock, updated_at = now()
    from public.inventory_items i where i.id = p_item_id and p.id = i.landing_product_id;
$$;

-- Upsert de delta (puede ser negativo) en el saldo por almacén. El guard va en cada RPC ANTES de llamar.
create or replace function public._add_warehouse_stock(_tenant uuid, _item uuid, _wh uuid, _delta numeric) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.inventory_stock (tenant_id, item_id, warehouse_id, quantity) values (_tenant, _item, _wh, _delta)
  on conflict (item_id, warehouse_id) do update set quantity = public.inventory_stock.quantity + _delta, updated_at = now();
end $$;
revoke execute on function public._add_warehouse_stock(uuid, uuid, uuid, numeric) from public, anon, authenticated;
revoke execute on function public._recalc_item_total_stock(uuid) from public, anon, authenticated;

-- Ítem nuevo (creado por el form, no por RPC) → espeja su stock inicial al almacén default (mantiene el invariante).
create or replace function public._seed_item_stock() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _wh uuid;
begin
  _wh := public._default_warehouse(NEW.tenant_id);
  if _wh is not null then
    insert into public.inventory_stock (tenant_id, item_id, warehouse_id, quantity, min_stock, reorder_point, reorder_qty, location_zone, location_aisle, location_shelf, location_bin)
      values (NEW.tenant_id, NEW.id, _wh, coalesce(NEW.stock, 0), NEW.min_stock, NEW.reorder_point, NEW.reorder_qty, NEW.warehouse_zone, NEW.aisle, NEW.shelf, NEW.bin)
    on conflict (item_id, warehouse_id) do nothing;
  end if;
  return NEW;
end $$;
create trigger trg_seed_item_stock after insert on public.inventory_items for each row execute function public._seed_item_stock();

-- Invariante blindado: inventory_items.stock SIEMPRE = Σ(inventory_stock) en cualquier UPDATE. Neutraliza el
-- edit-form actual (que aún manda stock directo) sin tocar frontend → nada puede desincronizar el total.
-- Todas las RPCs actualizan inventory_stock ANTES de tocar inventory_items, así que el SUM ya está vigente.
create or replace function public._sync_item_stock_total() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  new.stock := coalesce((select sum(quantity) from public.inventory_stock where item_id = new.id), old.stock);
  return new;
end $$;
create trigger trg_sync_item_stock_total before update on public.inventory_items for each row execute function public._sync_item_stock_total();

-- ── SEED / BACKFILL (idempotente) ─────────────────────────────────────────────────────────────────────
-- Almacén default para cada tenant con ítems (Zafacones con dirección; el resto genérico).
insert into public.warehouses (tenant_id, name, code, is_default, address)
select distinct i.tenant_id, 'Almacén Principal', 'ALM-PRINCIPAL', true,
  case when i.tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' then 'Base Zafacones Ramos' else null end
from public.inventory_items i
where not exists (select 1 from public.warehouses w where w.tenant_id = i.tenant_id and w.is_default and w.deleted_at is null);

-- Backfill de inventory_stock: cada ítem → fila en su almacén default (sin deleted_at: inventory_items no lo tiene).
insert into public.inventory_stock (tenant_id, item_id, warehouse_id, quantity, min_stock, reorder_point, reorder_qty, location_zone, location_aisle, location_shelf, location_bin)
select i.tenant_id, i.id, w.id, i.stock, i.min_stock, i.reorder_point, i.reorder_qty, i.warehouse_zone, i.aisle, i.shelf, i.bin
from public.inventory_items i join public.warehouses w on w.tenant_id = i.tenant_id and w.is_default and w.deleted_at is null
on conflict (item_id, warehouse_id) do nothing;

-- Backfill de movimientos históricos al almacén default.
update public.inventory_movements m set warehouse_id = w.id
from public.warehouses w where w.tenant_id = m.tenant_id and w.is_default and w.deleted_at is null and m.warehouse_id is null;

-- Trial seeder: almacén default para tenants nuevos.
create or replace function private._seed_trial_tenant(_tenant_id uuid)
 returns void language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
begin
  insert into public.settings (tenant_id, key, value) values
    (_tenant_id, 'order_prefix', to_jsonb('TR'::text)), (_tenant_id, 'retention_enabled', to_jsonb(false))
  on conflict (tenant_id, key) do nothing;
  insert into public.tenant_themes (tenant_id) values (_tenant_id) on conflict (tenant_id) do nothing;
  insert into public.tenant_landing_config (tenant_id, hero_title, hero_cta_type)
    select _tenant_id, coalesce(nullif(trim(t.display_name),''), nullif(trim(t.legal_name),''), 'Bienvenido'), 'quote'
    from public.tenants t where t.id = _tenant_id on conflict (tenant_id) do nothing;
  insert into public.warehouses (tenant_id, name, code, is_default) values (_tenant_id, 'Almacén Principal', 'ALM-PRINCIPAL', true)
    on conflict (tenant_id, code) do nothing;
  insert into public.categories (tenant_id, kind, label, sort) values
    (_tenant_id,'income','Ventas',1),(_tenant_id,'income','Servicios',2),(_tenant_id,'income','Otros ingresos',3),
    (_tenant_id,'expense','Nómina',1),(_tenant_id,'expense','Materiales',2),(_tenant_id,'expense','Renta',3),
    (_tenant_id,'payment_method','Efectivo',1),(_tenant_id,'payment_method','Transferencia',2),
    (_tenant_id,'support_category','IT',1),(_tenant_id,'support_category','RRHH',2),(_tenant_id,'support_category','Operaciones',3),
    (_tenant_id,'support_category','Instalaciones',4),(_tenant_id,'support_category','Otro',5),
    (_tenant_id,'inventory_category','Limpieza',1),(_tenant_id,'inventory_category','Equipos',2),
    (_tenant_id,'inventory_category','Químicos',3),(_tenant_id,'inventory_category','Repuestos',4),
    (_tenant_id,'inventory_category','Seguridad',5),(_tenant_id,'inventory_category','Oficina',6),
    (_tenant_id,'inventory_category','Otro',7)
  on conflict (tenant_id, kind, label) do nothing;
  insert into public.units_of_measure (tenant_id, name, abbreviation, uom_group, is_default) values
    (_tenant_id,'Unidad','un','count',true),(_tenant_id,'Caja','cj','count',false),(_tenant_id,'Par','par','count',false),
    (_tenant_id,'Galón','gal','volume',false),(_tenant_id,'Litro','lt','volume',false),(_tenant_id,'Libra','lb','weight',false),
    (_tenant_id,'Pie','ft','length',false),(_tenant_id,'Rollo','rollo','other',false),(_tenant_id,'Paquete','paq','count',false)
  on conflict (tenant_id, abbreviation) do nothing;
end; $function$;

-- ── RPCs (drop de la firma vieja + create con warehouse) ──────────────────────────────────────────────
drop function if exists public.record_restock(uuid, numeric, numeric, text, text, date, uuid);
create or replace function public.record_restock(p_item_id uuid, p_quantity numeric, p_unit_cost numeric, p_supplier text default null, p_notes text default null, p_date date default current_date, p_supplier_id uuid default null, p_warehouse_id uuid default null)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _item public.inventory_items%rowtype; _mv_id uuid; _base_avg numeric; _new_avg numeric; _wh uuid;
begin
  if p_quantity is null or p_quantity <= 0 then raise exception 'Cantidad inválida'; end if;
  if p_unit_cost is null or p_unit_cost < 0 then raise exception 'Costo inválido'; end if;
  select * into _item from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  _wh := coalesce(p_warehouse_id, public._default_warehouse(_tenant));
  if _wh is null then raise exception 'No hay almacén configurado'; end if;
  _base_avg := coalesce(nullif(_item.avg_cost, 0), nullif(_item.unit_cost, 0), p_unit_cost);
  _new_avg := case when _item.stock + p_quantity > 0 then ((_base_avg * _item.stock) + (p_unit_cost * p_quantity)) / (_item.stock + p_quantity) else p_unit_cost end;
  insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, supplier_id, warehouse_id)
    values (_tenant, p_item_id, 'entrada', p_quantity, p_unit_cost, p_notes, auth.uid(), p_date, p_supplier_id, _wh) returning id into _mv_id;
  perform public._add_warehouse_stock(_tenant, p_item_id, _wh, p_quantity);
  update public.inventory_items set avg_cost = round(_new_avg, 2), unit_cost = p_unit_cost, last_restock_date = now(),
    supplier_name = coalesce(p_supplier, supplier_name), supplier_id = coalesce(p_supplier_id, supplier_id), updated_at = now()
  where id = p_item_id and tenant_id = _tenant;
  perform public._recalc_item_total_stock(p_item_id);
  return _mv_id;
end $function$;

drop function if exists public.record_adjustment(uuid, numeric, text);
create or replace function public.record_adjustment(p_item_id uuid, p_new_qty numeric, p_reason text default null, p_warehouse_id uuid default null)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _avg numeric; _name text; _wh uuid; _wq numeric; _diff numeric; _mv_id uuid;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_new_qty is null then raise exception 'Cantidad inválida'; end if;
  if p_new_qty < 0 then raise exception 'Stock no puede quedar negativo (solicitado: %)', p_new_qty; end if;
  select avg_cost, name into _avg, _name from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  _wh := coalesce(p_warehouse_id, public._default_warehouse(_tenant));
  if _wh is null then raise exception 'No hay almacén configurado'; end if;
  select quantity into _wq from public.inventory_stock where item_id = p_item_id and warehouse_id = _wh for update;
  _diff := p_new_qty - coalesce(_wq, 0);
  if _diff = 0 then return null; end if;
  insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, delta, unit_cost, notes, created_by, movement_date, warehouse_id)
    values(_tenant, p_item_id, 'ajuste', abs(_diff), _diff, _avg, coalesce(nullif(p_reason,''),'Ajuste manual'), auth.uid(), current_date, _wh) returning id into _mv_id;
  insert into public.inventory_stock (tenant_id, item_id, warehouse_id, quantity) values (_tenant, p_item_id, _wh, p_new_qty)
    on conflict (item_id, warehouse_id) do update set quantity = p_new_qty, updated_at = now();
  perform public._recalc_item_total_stock(p_item_id);
  return _mv_id;
end $function$;

drop function if exists public.record_shrinkage(uuid, numeric, text);
create or replace function public.record_shrinkage(p_item_id uuid, p_qty numeric, p_reason text default null, p_warehouse_id uuid default null)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _avg numeric; _name text; _wh uuid; _wq numeric; _mv_id uuid;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'Cantidad inválida'; end if;
  select avg_cost, name into _avg, _name from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  _wh := coalesce(p_warehouse_id, public._default_warehouse(_tenant));
  select quantity into _wq from public.inventory_stock where item_id = p_item_id and warehouse_id = _wh for update;
  if coalesce(_wq, 0) - p_qty < 0 then raise exception 'Stock insuficiente para %: disponible %, requerido %', _name, coalesce(_wq, 0), p_qty; end if;
  insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, warehouse_id)
    values(_tenant, p_item_id, 'merma', p_qty, _avg, coalesce(nullif(p_reason,''),'Merma'), auth.uid(), current_date, _wh) returning id into _mv_id;
  perform public._add_warehouse_stock(_tenant, p_item_id, _wh, -p_qty);
  perform public._recalc_item_total_stock(p_item_id);
  return _mv_id;
end $function$;

-- transfer_stock REAL entre almacenes (overload nuevo; el de 7-arg se conserva para no romper prod).
create or replace function public.transfer_stock(p_item_id uuid, p_qty numeric, p_from_warehouse_id uuid, p_to_warehouse_id uuid, p_notes text default null)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _avg numeric; _name text; _wq numeric; _mv uuid;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'Cantidad inválida'; end if;
  if p_from_warehouse_id = p_to_warehouse_id then raise exception 'Almacén origen y destino iguales'; end if;
  select avg_cost, name into _avg, _name from public.inventory_items where id = p_item_id and tenant_id = _tenant;
  if not found then raise exception 'Item no encontrado'; end if;
  select quantity into _wq from public.inventory_stock where item_id = p_item_id and warehouse_id = p_from_warehouse_id for update;
  if coalesce(_wq, 0) - p_qty < 0 then raise exception 'Stock insuficiente en origen para %: disponible %, requerido %', _name, coalesce(_wq, 0), p_qty; end if;
  insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, warehouse_id, to_warehouse_id, notes, created_by, movement_date)
    values(_tenant, p_item_id, 'transferencia', p_qty, coalesce(_avg, 0), p_from_warehouse_id, p_to_warehouse_id, p_notes, auth.uid(), current_date) returning id into _mv;
  perform public._add_warehouse_stock(_tenant, p_item_id, p_from_warehouse_id, -p_qty);
  perform public._add_warehouse_stock(_tenant, p_item_id, p_to_warehouse_id, p_qty);
  perform public._recalc_item_total_stock(p_item_id);
  return _mv;
end $function$;

drop function if exists public.record_stop_supplies(uuid, jsonb);
create or replace function public.record_stop_supplies(p_stop_id uuid, p_items jsonb, p_warehouse_id uuid default null)
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare v_tenant uuid; v_item jsonb; v_item_id uuid; v_qty numeric; v_cost numeric; v_name text; v_wh uuid; v_wq numeric;
begin
  select r.tenant_id into v_tenant from route_stops s join service_routes r on r.id = s.route_id where s.id = p_stop_id;
  if v_tenant is null or v_tenant <> current_tenant() then raise exception 'Parada no encontrada'; end if;
  if not can_access_module('routes', 'edit') then raise exception 'No autorizado'; end if;
  v_wh := coalesce(p_warehouse_id, public._default_warehouse(v_tenant));
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_item_id := (v_item->>'item_id')::uuid; v_qty := (v_item->>'quantity')::numeric;
    if v_qty is null or v_qty <= 0 then continue; end if;
    select unit_cost, name into v_cost, v_name from inventory_items where id = v_item_id and tenant_id = v_tenant for update;
    if not found then raise exception 'Insumo no encontrado'; end if;
    select quantity into v_wq from public.inventory_stock where item_id = v_item_id and warehouse_id = v_wh for update;
    if coalesce(v_wq, 0) - v_qty < 0 then raise exception 'Stock insuficiente para %: disponible %, requerido %', v_name, coalesce(v_wq, 0), v_qty; end if;
    insert into inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, linked_stop_id, created_by, warehouse_id)
      values (v_tenant, v_item_id, 'salida', v_qty, v_cost, current_date, 'Insumo de ruta', p_stop_id, auth.uid(), v_wh);
    perform public._add_warehouse_stock(v_tenant, v_item_id, v_wh, -v_qty);
    perform public._recalc_item_total_stock(v_item_id);
  end loop;
end $function$;

drop function if exists public.receive_purchase_order(uuid, jsonb);
create or replace function public.receive_purchase_order(p_order_id uuid, p_items jsonb, p_warehouse_id uuid default null)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _po public.inventory_purchase_orders%rowtype; _it jsonb; _item_id uuid; _rq numeric; _cost numeric; _mv uuid; _all boolean; _wh uuid;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select * into _po from public.inventory_purchase_orders where id = p_order_id and tenant_id = _tenant for update;
  if not found then raise exception 'Orden no encontrada'; end if;
  _wh := coalesce(p_warehouse_id, public._default_warehouse(_tenant));
  for _it in select * from jsonb_array_elements(p_items) loop
    _item_id := (_it->>'item_id')::uuid; _rq := coalesce((_it->>'received_qty')::numeric, 0);
    if _rq <= 0 then continue; end if;
    select unit_cost into _cost from public.inventory_purchase_order_items where order_id = p_order_id and item_id = _item_id;
    if _cost is null then continue; end if;
    update public.inventory_purchase_order_items set received_qty = received_qty + _rq where order_id = p_order_id and item_id = _item_id;
    _mv := public.record_restock(_item_id, _rq, _cost, null, 'Recepción PO', current_date, _po.supplier_id, _wh);
    update public.inventory_movements set linked_restock_id = p_order_id where id = _mv;
  end loop;
  select bool_and(received_qty >= quantity) into _all from public.inventory_purchase_order_items where order_id = p_order_id;
  update public.inventory_purchase_orders set status = case when _all then 'received' else 'partial' end,
    received_at = case when _all then now() else received_at end, updated_at = now() where id = p_order_id;
  return jsonb_build_object('status', case when _all then 'received' else 'partial' end);
end $function$;

-- apply_inventory_count: propaga el warehouse_id de cada línea a record_adjustment.
create or replace function public.apply_inventory_count(p_count_id uuid)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _num text; _l record;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select count_number into _num from public.inventory_counts where id=p_count_id and tenant_id=_t and status='approved';
  if _num is null then raise exception 'Conteo no aprobado'; end if;
  for _l in select id, item_id, counted_qty, expected_qty, warehouse_id from public.inventory_count_lines
    where count_id=p_count_id and line_status='approved' and counted_qty is not null and counted_qty <> expected_qty loop
    perform public.record_adjustment(_l.item_id, _l.counted_qty, 'Conteo cíclico ' || _num || ': ' || _l.expected_qty || ' → ' || _l.counted_qty, _l.warehouse_id);
    update public.inventory_count_lines set line_status='applied' where id=_l.id;
  end loop;
  update public.inventory_counts set status='applied', applied_at=now() where id=p_count_id;
  return p_count_id;
end $function$;

-- confirm_landing_order: BLOQUE 3 deduce del almacén default vía inventory_stock (resto idéntico).
create or replace function public.confirm_landing_order(_order_id uuid, _payment_method_id uuid default null, _create_invoice boolean default true, _note text default null)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _o public.tenant_landing_orders%rowtype;
        _cat uuid; _pm uuid; _income uuid; _invoice uuid; _lead uuid; _name text; _phone text; _sub boolean;
        _it jsonb; _inv_id uuid; _qty numeric; _cogs numeric; _pname text; _wh uuid; _wq numeric;
begin
  if not public.is_ceo_or_above() then return jsonb_build_object('status','error','code','forbidden'); end if;
  select * into _o from public.tenant_landing_orders where id = _order_id and tenant_id = _t;
  if not found then return jsonb_build_object('status','error','code','not_found'); end if;
  if _o.status in ('paid','refunded','canceled') then return jsonb_build_object('status','error','code','already_confirmed'); end if;
  _name := coalesce(nullif(trim(_o.customer_name),''),'Cliente web'); _phone := coalesce(_o.customer_phone,'');
  _sub := _o.order_type = 'subscription'; _pm := _payment_method_id;
  if _pm is null then select id into _pm from public.categories where tenant_id=_t and kind='payment_method' and label='Efectivo' limit 1;
    if _pm is null then insert into public.categories(tenant_id,kind,label,sort) values(_t,'payment_method','Efectivo',90) returning id into _pm; end if; end if;
  select id into _cat from public.categories where tenant_id=_t and kind='income' and label='Venta web' limit 1;
  if _cat is null then insert into public.categories(tenant_id,kind,label,sort) values(_t,'income','Venta web',86) returning id into _cat; end if;
  insert into public.income(tenant_id,category_id,payment_method_id,amount,income_date,client_reference,order_number,notes,created_by)
    values(_t,_cat,_pm,_o.total,current_date,_name,_o.order_number,'Orden web '||coalesce(_o.order_number,''),auth.uid()) returning id into _income;
  _lead := _o.linked_lead_id;
  if _lead is null then
    select id into _lead from public.leads where tenant_id=_t and ((_o.customer_email is not null and email=_o.customer_email) or (_phone<>'' and phone=_phone)) limit 1;
    if _lead is null then
      insert into public.leads(tenant_id,contact_name,phone,email,service_requested,lead_source,temperature,status,attended_by)
        values(_t,_name,_phone,_o.customer_email,'Orden web '||coalesce(_o.order_number,''),'order-web','warm','converted',auth.uid()) returning id into _lead;
    end if;
  end if;
  if _create_invoice then
    insert into public.invoices(tenant_id,client_name,phone,email,items,subtotal,tax,total,status,paid_at,payment_method_id,linked_income_id,linked_lead_id,linked_order_id,created_by)
      values(_t,_name,_o.customer_phone,_o.customer_email,_o.items,_o.subtotal,_o.tax,_o.total,'paid',now(),_pm,_income,_lead,_order_id,auth.uid()) returning id into _invoice;
  end if;
  _wh := public._default_warehouse(_t);
  for _it in select * from jsonb_array_elements(coalesce(_o.items,'[]'::jsonb)) loop
    if _it->>'kind' = 'product' then
      _qty := coalesce((_it->>'qty')::numeric, 1);
      select id, coalesce(avg_cost, unit_cost, 0), name into _inv_id, _cogs, _pname
        from public.inventory_items where landing_product_id = (_it->>'id')::uuid and tenant_id = _t for update;
      if _inv_id is not null and _qty > 0 then
        select quantity into _wq from public.inventory_stock where item_id = _inv_id and warehouse_id = _wh for update;
        if coalesce(_wq, 0) - _qty < 0 then raise exception 'Stock insuficiente para %: disponible %, requerido %', _pname, coalesce(_wq, 0), _qty; end if;
        insert into public.inventory_movements(tenant_id, item_id, movement_type, quantity, unit_cost, linked_order_id, notes, created_by, movement_date, warehouse_id)
          values(_t, _inv_id, 'venta_publica', _qty, _cogs, _order_id, 'Venta web #'||coalesce(_o.order_number,''), auth.uid(), current_date, _wh);
        perform public._add_warehouse_stock(_t, _inv_id, _wh, -_qty);
        perform public._recalc_item_total_stock(_inv_id);
      end if;
    end if;
  end loop;
  perform set_config('app.order_note', coalesce(_note,'Pago confirmado'), true);
  update public.tenant_landing_orders set status='paid', payment_status='paid', paid_at=now(), linked_lead_id=_lead, linked_invoice_id=_invoice, updated_at=now(),
    cycles_paid = case when _sub then _o.cycles_paid + 1 else _o.cycles_paid end,
    last_cycle_paid_at = case when _sub then now() else last_cycle_paid_at end,
    last_cycle_notify_sent_at = case when _sub then null else last_cycle_notify_sent_at end
  where id=_order_id;
  return jsonb_build_object('status','ok','income_id',_income,'invoice_id',_invoice,'lead_id',_lead);
end $function$;

-- _apply_invoice_stock: deduce/devuelve en el almacén default vía inventory_stock.
create or replace function public._apply_invoice_stock(_invoice_id uuid, _return boolean)
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare _inv record; _line record; _item_id uuid; _cogs numeric; _iname text; _wh uuid; _wq numeric;
  _mtype text := case when _return then 'devolucion' else 'venta_publica' end;
begin
  select id, tenant_id, invoice_number into _inv from public.invoices where id = _invoice_id;
  if not found then return; end if;
  _wh := public._default_warehouse(_inv.tenant_id);
  for _line in select product_id, quantity from public.invoice_line_items where invoice_id = _invoice_id and product_id is not null loop
    select id, coalesce(avg_cost, unit_cost, 0), name into _item_id, _cogs, _iname from public.inventory_items
      where landing_product_id = _line.product_id and tenant_id = _inv.tenant_id for update;
    if _item_id is null then continue; end if;
    select quantity into _wq from public.inventory_stock where item_id = _item_id and warehouse_id = _wh for update;
    if not _return and coalesce(_wq, 0) - _line.quantity < 0 then
      raise exception 'Stock insuficiente para %: disponible %, requerido %', _iname, coalesce(_wq, 0), _line.quantity;
    end if;
    insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, created_by, warehouse_id)
      values (_inv.tenant_id, _item_id, _mtype, _line.quantity, _cogs, current_date,
        (case when _return then 'Reversa factura #' else 'Venta factura #' end) || coalesce(_inv.invoice_number, ''), auth.uid(), _wh);
    perform public._add_warehouse_stock(_inv.tenant_id, _item_id, _wh, case when _return then _line.quantity else -_line.quantity end);
    perform public._recalc_item_total_stock(_item_id);
  end loop;
end $function$;
