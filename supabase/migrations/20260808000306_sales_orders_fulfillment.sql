-- ============================================================================
-- V1 · Flujo de ventas enterprise — MIGRACIÓN FUNDACIONAL
-- Sales Orders + Delivery Notes (conduces) + Stock Reservation (ATP) + Budget GL
-- Diseño: docs-nucleo/ARQUITECTURA-FLUJO-VENTAS-NUCLEO.md
-- Decisiones: D1 SO manual · D2 conduce sin SO ok · D3 backorder/no-ATP-negativo
--             D4 órdenes web fuera · D5 conduce independiente de /my-route
--             D6 numeración SO-####/CN-#### · D7 tablas espejo *_items
-- Aditivo y backward-compat: fulfillment_enabled default false → cero cambio
-- para tenants existentes (Zafacones sigue Cotización→Factura intacto).
-- ============================================================================

-- ── TAREA 1 · Flag fulfillment_enabled ──────────────────────────────────────
alter table public.tenants
  add column if not exists fulfillment_enabled boolean not null default false;

-- ── TAREA 2 · Sales Orders ──────────────────────────────────────────────────
create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_number text not null,                       -- auto: SO-0001
  quote_id uuid references public.quotes(id),       -- opcional (venta directa = null)
  customer_id uuid not null references public.customer_profiles(id),
  order_date date not null default current_date,
  delivery_date date,                               -- fecha prometida de entrega
  status text not null default 'draft'
    check (status in ('draft','confirmed','partially_shipped','shipped',
                      'partially_invoiced','invoiced','closed','cancelled')),
  subtotal numeric not null default 0,
  tax_amount numeric not null default 0,
  discount_amount numeric not null default 0,
  total numeric not null default 0,
  shipping_address_id uuid references public.customer_addresses(id),
  shipping_notes text,
  payment_terms text,                               -- heredado del cliente/quote
  notes_internal text,                              -- solo staff
  notes_customer text,                              -- visible al cliente
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles(id),
  closed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, order_number)
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid references public.tenant_landing_products(id),
  item_id uuid references public.inventory_items(id),
  description text not null,
  qty_ordered numeric not null default 1,
  qty_shipped numeric not null default 0,           -- ↑ al despachar (V2)
  qty_invoiced numeric not null default 0,          -- ↑ al facturar (V2)
  qty_backordered numeric not null default 0,       -- pendiente por falta de stock
  unit_price numeric not null default 0,
  discount_pct numeric not null default 0,
  tax_pct numeric not null default 0,
  subtotal numeric generated always as
    (round(qty_ordered * unit_price * (1 - discount_pct / 100), 2)) stored,
  tax numeric generated always as
    (round(qty_ordered * unit_price * (1 - discount_pct / 100) * tax_pct / 100, 2)) stored,
  total numeric generated always as
    (round(qty_ordered * unit_price * (1 - discount_pct / 100) * (1 + tax_pct / 100), 2)) stored,
  warehouse_id uuid references public.warehouses(id),
  line_order integer default 0,
  created_at timestamptz default now()
);
create index if not exists idx_so_items_so on public.sales_order_items(sales_order_id);
create index if not exists idx_so_items_item on public.sales_order_items(item_id);
create index if not exists idx_sales_orders_tenant on public.sales_orders(tenant_id, status);
create index if not exists idx_sales_orders_customer on public.sales_orders(customer_id);

-- ── TAREA 3 · Delivery Notes (conduces) ─────────────────────────────────────
create table if not exists public.delivery_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  note_number text not null,                        -- auto: CN-0001
  sales_order_id uuid references public.sales_orders(id),  -- opcional (D2 despacho directo)
  customer_id uuid not null references public.customer_profiles(id),
  status text not null default 'draft'
    check (status in ('draft','dispatched','in_transit','delivered','cancelled')),
  dispatch_date date,
  delivery_date date,                               -- real (cuándo se entregó)
  shipping_address text,                            -- snapshot (la dirección puede cambiar)
  shipping_notes text,
  received_by text,                                 -- nombre de quien recibe
  signature_data text,                              -- base64 firma (SignaturePad)
  evidence_photos jsonb default '[]',               -- [{url,type:'dispatch'|'delivery'}]
  dispatched_by uuid references public.profiles(id),
  delivered_by uuid references public.profiles(id),
  notes text,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, note_number)
);

create table if not exists public.delivery_note_items (
  id uuid primary key default gen_random_uuid(),
  delivery_note_id uuid not null references public.delivery_notes(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  so_item_id uuid references public.sales_order_items(id),
  product_id uuid references public.tenant_landing_products(id),
  item_id uuid references public.inventory_items(id),
  description text not null,
  qty_dispatched numeric not null default 1,
  warehouse_id uuid references public.warehouses(id),
  lot_id uuid references public.inventory_lots(id),
  line_order integer default 0,
  created_at timestamptz default now()
);
create index if not exists idx_dn_items_dn on public.delivery_note_items(delivery_note_id);
create index if not exists idx_delivery_notes_tenant on public.delivery_notes(tenant_id, status);
create index if not exists idx_delivery_notes_so on public.delivery_notes(sales_order_id);

-- ── TAREA 4 · Stock Reservation (ATP = quantity − reserved_qty) ──────────────
alter table public.inventory_stock
  add column if not exists reserved_qty numeric not null default 0;
alter table public.inventory_items
  add column if not exists reserved numeric not null default 0;
-- D3: ATP nunca negativo → reserva nunca negativa
alter table public.inventory_stock
  drop constraint if exists chk_stock_reserved_non_negative;
alter table public.inventory_stock
  add constraint chk_stock_reserved_non_negative check (reserved_qty >= 0);
alter table public.inventory_items
  drop constraint if exists chk_item_reserved_non_negative;
alter table public.inventory_items
  add constraint chk_item_reserved_non_negative check (reserved >= 0);

-- ── TAREA 5 · FKs de encadenamiento en invoices ─────────────────────────────
alter table public.invoices
  add column if not exists sales_order_id uuid references public.sales_orders(id),
  add column if not exists delivery_note_id uuid references public.delivery_notes(id);

-- ── TAREA 6 · Extender el guard de deducción de stock ───────────────────────
-- Antes: deduce al pagar si linked_order_id IS NULL.
-- Ahora: NO deduce si viene de un flujo de fulfillment (el conduce ya dedujo).
-- Servicio puro (sin SO/DN) = comportamiento idéntico a hoy → backward-compat total.
create or replace function public._invoice_stock_on_status()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if new.status = 'paid' and old.status is distinct from 'paid'
     and new.linked_order_id is null
     and new.sales_order_id is null           -- NUEVO: SO ya reservó/despachó
     and new.delivery_note_id is null         -- NUEVO: conduce ya dedujo el físico
     and new.stock_deducted_at is null then
    perform public._apply_invoice_stock(new.id, false);
    update public.invoices set stock_deducted_at = now() where id = new.id;
  elsif old.status = 'paid' and new.status is distinct from 'paid'
        and new.stock_deducted_at is not null then
    perform public._apply_invoice_stock(new.id, true);
    update public.invoices set stock_deducted_at = null where id = new.id;
  end if;
  return null;
end $function$;

-- ── TAREA 7 · Numeración automática (patrón _next_vendor_bill_number) ────────
create or replace function public._next_sales_order_number(p_tenant_id uuid)
 returns text language sql stable security definer set search_path to 'public'
as $function$
  select 'SO-' || lpad(
    (coalesce(max(nullif(regexp_replace(order_number, '[^0-9]', '', 'g'), '')::int), 0) + 1)::text,
    4, '0')
  from public.sales_orders where tenant_id = p_tenant_id;
$function$;

create or replace function public._next_delivery_note_number(p_tenant_id uuid)
 returns text language sql stable security definer set search_path to 'public'
as $function$
  select 'CN-' || lpad(
    (coalesce(max(nullif(regexp_replace(note_number, '[^0-9]', '', 'g'), '')::int), 0) + 1)::text,
    4, '0')
  from public.delivery_notes where tenant_id = p_tenant_id;
$function$;

create or replace function public.set_sales_order_number()
 returns trigger language plpgsql set search_path to 'public'
as $function$
begin
  if NEW.order_number is null then
    NEW.order_number := public._next_sales_order_number(NEW.tenant_id);
  end if;
  return NEW;
end $function$;

create or replace function public.set_delivery_note_number()
 returns trigger language plpgsql set search_path to 'public'
as $function$
begin
  if NEW.note_number is null then
    NEW.note_number := public._next_delivery_note_number(NEW.tenant_id);
  end if;
  return NEW;
end $function$;

drop trigger if exists trg_so_number on public.sales_orders;
create trigger trg_so_number before insert on public.sales_orders
  for each row execute function public.set_sales_order_number();
drop trigger if exists trg_dn_number on public.delivery_notes;
create trigger trg_dn_number before insert on public.delivery_notes
  for each row execute function public.set_delivery_note_number();

-- ── TAREA 10 · Triggers: updated_at + recálculo de totales del SO ────────────
drop trigger if exists trg_so_updated_at on public.sales_orders;
create trigger trg_so_updated_at before update on public.sales_orders
  for each row execute function public.set_updated_at();
drop trigger if exists trg_dn_updated_at on public.delivery_notes;
create trigger trg_dn_updated_at before update on public.delivery_notes
  for each row execute function public.set_updated_at();

create or replace function public._recalc_sales_order_totals()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
declare _so uuid := coalesce(NEW.sales_order_id, OLD.sales_order_id);
begin
  update public.sales_orders so set
    subtotal        = coalesce((select sum(i.subtotal) from public.sales_order_items i where i.sales_order_id = _so), 0),
    tax_amount      = coalesce((select sum(i.tax) from public.sales_order_items i where i.sales_order_id = _so), 0),
    discount_amount = coalesce((select sum(round(i.qty_ordered * i.unit_price * i.discount_pct / 100, 2)) from public.sales_order_items i where i.sales_order_id = _so), 0),
    total           = coalesce((select sum(i.total) from public.sales_order_items i where i.sales_order_id = _so), 0),
    updated_at      = now()
  where so.id = _so;
  return null;
end $function$;

drop trigger if exists trg_recalc_so_totals on public.sales_order_items;
create trigger trg_recalc_so_totals
  after insert or update or delete on public.sales_order_items
  for each row execute function public._recalc_sales_order_totals();

-- ── TAREA 8 · Budget GL (independiente del fulfillment) ─────────────────────
create table if not exists public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  account_id uuid not null references public.chart_of_accounts(id),
  fiscal_year integer not null,
  period_month integer not null check (period_month between 1 and 12),
  budgeted_amount numeric not null default 0,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, account_id, fiscal_year, period_month)
);
create index if not exists idx_budget_lines_tenant on public.budget_lines(tenant_id, fiscal_year);

drop trigger if exists trg_budget_updated_at on public.budget_lines;
create trigger trg_budget_updated_at before update on public.budget_lines
  for each row execute function public.set_updated_at();

-- Presupuesto vs real (real = del GL, journal_entry_lines posteados).
-- Signo por naturaleza de la cuenta: debit → Dr−Cr ; credit → Cr−Dr.
create or replace function public.get_budget_vs_actual(
  p_tenant_id uuid default current_tenant(),
  p_fiscal_year integer default extract(year from current_date)::integer
) returns jsonb
 language plpgsql stable security definer set search_path to 'public'
as $function$
declare _t uuid := coalesce(p_tenant_id, current_tenant()); _res jsonb;
begin
  if _t <> current_tenant() then raise exception 'cross_tenant'; end if;
  if not public.can_access_module('accounting', 'view') then raise exception 'No autorizado'; end if;
  with actuals as (
    select jel.account_id, je.period_month as m,
           sum(case when coa.normal_balance = 'debit'
                    then jel.debit - jel.credit
                    else jel.credit - jel.debit end) as actual
    from public.journal_entry_lines jel
    join public.journal_entries je on je.id = jel.entry_id
    join public.chart_of_accounts coa on coa.id = jel.account_id
    where jel.tenant_id = _t and je.period_year = p_fiscal_year and je.status = 'posted'
    group by jel.account_id, je.period_month
  ),
  rows as (
    select coa.account_code, coa.account_name, coa.account_type,
           bl.period_month, bl.budgeted_amount as budgeted, coalesce(a.actual, 0) as actual
    from public.budget_lines bl
    join public.chart_of_accounts coa on coa.id = bl.account_id
    left join actuals a on a.account_id = bl.account_id and a.m = bl.period_month
    where bl.tenant_id = _t and bl.fiscal_year = p_fiscal_year
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'account_code', account_code, 'account_name', account_name, 'account_type', account_type,
      'month', period_month, 'budgeted', budgeted, 'actual', actual,
      'variance', budgeted - actual,
      'variance_pct', case when budgeted <> 0 then round((budgeted - actual) / budgeted * 100, 2) else null end
    ) order by account_code, period_month), '[]'::jsonb)
  into _res from rows;
  return _res;
end $function$;

create or replace function public.upsert_budget_line(
  p_account_id uuid, p_fiscal_year integer, p_month integer,
  p_amount numeric, p_notes text default null
) returns void
 language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  if p_month < 1 or p_month > 12 then raise exception 'Mes inválido'; end if;
  if not exists (select 1 from public.chart_of_accounts
                 where id = p_account_id and tenant_id = current_tenant() and is_header = false) then
    raise exception 'Cuenta inválida (inexistente, de otro tenant, o header)';
  end if;
  insert into public.budget_lines(tenant_id, account_id, fiscal_year, period_month, budgeted_amount, notes, created_by)
    values (current_tenant(), p_account_id, p_fiscal_year, p_month, p_amount, p_notes, auth.uid())
  on conflict (tenant_id, account_id, fiscal_year, period_month)
    do update set budgeted_amount = excluded.budgeted_amount, notes = excluded.notes, updated_at = now();
end $function$;

-- ── TAREA 9 · RLS ───────────────────────────────────────────────────────────
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.delivery_notes enable row level security;
alter table public.delivery_note_items enable row level security;
alter table public.budget_lines enable row level security;

-- Sales Orders / Delivery Notes: ver módulo sales; escribir edit (ceo/coo por rol)
drop policy if exists so_all on public.sales_orders;
create policy so_all on public.sales_orders for all
  using (tenant_id = current_tenant() and public.can_access_module('sales', 'view'))
  with check (tenant_id = current_tenant() and public.can_access_module('sales', 'edit'));
drop policy if exists so_items_all on public.sales_order_items;
create policy so_items_all on public.sales_order_items for all
  using (tenant_id = current_tenant() and public.can_access_module('sales', 'view'))
  with check (tenant_id = current_tenant() and public.can_access_module('sales', 'edit'));
drop policy if exists dn_all on public.delivery_notes;
create policy dn_all on public.delivery_notes for all
  using (tenant_id = current_tenant() and public.can_access_module('sales', 'view'))
  with check (tenant_id = current_tenant() and public.can_access_module('sales', 'edit'));
drop policy if exists dn_items_all on public.delivery_note_items;
create policy dn_items_all on public.delivery_note_items for all
  using (tenant_id = current_tenant() and public.can_access_module('sales', 'view'))
  with check (tenant_id = current_tenant() and public.can_access_module('sales', 'edit'));

-- Budget: ver accounting.view ; escribir solo CEO+ (patrón journal_entries)
drop policy if exists budget_select on public.budget_lines;
create policy budget_select on public.budget_lines for select
  using (tenant_id = current_tenant() and public.can_access_module('accounting', 'view'));
drop policy if exists budget_write on public.budget_lines;
create policy budget_write on public.budget_lines for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above())
  with check (tenant_id = current_tenant() and public.is_ceo_or_above());

-- ── TAREA 11 · Seed (VitalMotion = slug vital-motion-cafbf0) ─────────────────
-- Idempotente y seguro: no-op si el tenant no existe o ya fue seedeado.
-- Alcance V1: activar fulfillment + SO-0001 confirmado con reserva de stock +
-- conduce CN-0001 en DRAFT (sin despacho) + budget. El DESPACHO real (deducción
-- FIFO + COGS GL) es responsabilidad del RPC dispatch_delivery_note (Sesión V2)
-- — no se hand-rollea en un seed permanente para no mutar inventario/GL aquí.
do $seed$
declare
  _t uuid; _cust uuid; _creator uuid; _wh uuid;
  _so uuid; _dn uuid; _acct uuid;
  _it record; _n int := 0; _yr int := extract(year from current_date)::int;
  _reserve numeric[] := array[5, 4, 3];
begin
  select id into _t from public.tenants where slug = 'vital-motion-cafbf0';
  if _t is null then return; end if;                          -- entorno sin VitalMotion
  if exists (select 1 from public.sales_orders where tenant_id = _t) then return; end if;  -- ya seedeado

  update public.tenants set fulfillment_enabled = true where id = _t;

  select id into _cust from public.customer_profiles where tenant_id = _t order by created_at limit 1;
  select id into _creator from public.profiles where tenant_id = _t order by created_at limit 1;
  _wh := public._default_warehouse(_t);
  if _cust is null or _creator is null or _wh is null then return; end if;

  -- SO-0001 confirmado (número lo pone el trigger)
  insert into public.sales_orders(tenant_id, customer_id, status, order_date, delivery_date,
                                  payment_terms, notes_customer, confirmed_at, confirmed_by, created_by)
    values (_t, _cust, 'confirmed', current_date, current_date + 5,
            'net_15', 'Pedido demo del flujo de fulfillment', now(), _creator, _creator)
    returning id into _so;

  -- 3 líneas: items 'none' con stock en el almacén default (resueltos dinámicamente)
  for _it in
    select i.id, i.name, coalesce(i.avg_cost, i.unit_cost, 0) as cost
    from public.inventory_stock s
    join public.inventory_items i on i.id = s.item_id
    where s.tenant_id = _t and s.warehouse_id = _wh and i.tracking_type = 'none' and s.quantity >= 5
    order by s.quantity desc limit 3
  loop
    _n := _n + 1;
    insert into public.sales_order_items(sales_order_id, tenant_id, item_id, description,
                                         qty_ordered, unit_price, tax_pct, warehouse_id, line_order)
      values (_so, _t, _it.id, _it.name, _reserve[_n],
              round(greatest(_it.cost, 1) * 2, 2), 11.5, _wh, _n);
    -- Reservar (ATP): sube reserved_qty; NO toca el físico (quantity)
    update public.inventory_stock set reserved_qty = reserved_qty + _reserve[_n]
      where tenant_id = _t and item_id = _it.id and warehouse_id = _wh;
    update public.inventory_items set reserved = reserved + _reserve[_n] where id = _it.id;
  end loop;

  -- CN-0001 en DRAFT desde el SO (primeras 2 líneas). Sin despacho → sin movimiento de stock.
  if _n >= 2 then
    insert into public.delivery_notes(tenant_id, sales_order_id, customer_id, status,
                                      shipping_notes, notes, created_by)
      values (_t, _so, _cust, 'draft', 'Conduce demo (borrador)', 'Pendiente de despacho (V2)', _creator)
      returning id into _dn;
    insert into public.delivery_note_items(delivery_note_id, tenant_id, so_item_id, item_id,
                                           description, qty_dispatched, warehouse_id, line_order)
      select _dn, _t, si.id, si.item_id, si.description, si.qty_ordered, si.warehouse_id, si.line_order
      from public.sales_order_items si where si.sales_order_id = _so and si.line_order <= 2;
  end if;

  -- Budget: 6 cuentas P&L × 12 meses del año fiscal actual
  for _acct, _n in
    select id, case account_code
                 when '4100' then 5000 when '4200' then 8000 when '5100' then 3000
                 when '6100' then 6000 when '6200' then 2000 when '6400' then 1500 end
    from public.chart_of_accounts
    where tenant_id = _t and account_code in ('4100','4200','5100','6100','6200','6400')
  loop
    insert into public.budget_lines(tenant_id, account_id, fiscal_year, period_month, budgeted_amount, created_by)
      select _t, _acct, _yr, gs, _n, _creator from generate_series(1, 12) gs
      on conflict (tenant_id, account_id, fiscal_year, period_month) do nothing;
  end loop;
end $seed$;
