-- AP · Cuentas por Pagar — vendor bills + pagos + posting GL (Ola 3 · AP-1)
-- Flujo: recepción de PO → Dr 1130/Cr 2110 (deuda); bill = documento; pago → Dr 2110/Cr 1119.
-- Bill directo (sin PO) → al aprobar Dr[gasto]/Cr 2110; al pagar Dr 2110/Cr 1119.

-- Ampliar source_type del GL para asientos de AP
alter table public.journal_entries drop constraint journal_entries_source_type_check;
alter table public.journal_entries add constraint journal_entries_source_type_check
  check (source_type = any (array['expense','income','invoice','invoice_payment','payroll','inventory','bank','adjustment','closing','opening','vendor_bill','bill_payment']));

-- ============ Tablas ============
create table public.vendor_bills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_id uuid not null references public.inventory_suppliers(id),
  bill_number text not null,
  internal_number text not null,
  bill_date date not null,
  due_date date not null,
  status text not null default 'draft' check (status in ('draft','pending','approved','partially_paid','paid','voided','disputed')),
  subtotal numeric not null default 0,
  tax_amount numeric not null default 0,
  total numeric not null default 0,
  amount_paid numeric not null default 0,
  balance numeric generated always as (total - amount_paid) stored,
  currency text not null default 'USD',
  purchase_order_id uuid references public.inventory_purchase_orders(id),
  notes text,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique (tenant_id, internal_number),
  unique (tenant_id, supplier_id, bill_number)
);
create index idx_vendor_bills_tenant on public.vendor_bills(tenant_id, status);
create index idx_vendor_bills_supplier on public.vendor_bills(supplier_id);

create table public.vendor_bill_lines (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.vendor_bills(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  tax_pct numeric not null default 0,
  subtotal numeric generated always as (quantity * unit_price) stored,
  tax numeric generated always as (round(quantity * unit_price * tax_pct / 100, 2)) stored,
  total numeric generated always as (round(quantity * unit_price * (1 + tax_pct / 100), 2)) stored,
  item_id uuid references public.inventory_items(id),
  po_line_id uuid references public.inventory_purchase_order_items(id),
  category_id uuid references public.categories(id),
  account_id uuid references public.chart_of_accounts(id)
);
create index idx_vendor_bill_lines_bill on public.vendor_bill_lines(bill_id);

create table public.vendor_bill_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  bill_id uuid not null references public.vendor_bills(id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_date date not null default current_date,
  payment_method_id uuid references public.categories(id),
  reference text,
  notes text,
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  void_reason text,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz default now()
);
create index idx_vendor_bill_payments_bill on public.vendor_bill_payments(bill_id);

-- ============ RLS ============
alter table public.vendor_bills enable row level security;
alter table public.vendor_bill_lines enable row level security;
alter table public.vendor_bill_payments enable row level security;

create policy vb_select on public.vendor_bills for select using (tenant_id = current_tenant() and public.can_access_module('accounting','view'));
create policy vb_write  on public.vendor_bills for all using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
create policy vbl_select on public.vendor_bill_lines for select using (tenant_id = current_tenant() and public.can_access_module('accounting','view'));
create policy vbl_write  on public.vendor_bill_lines for all using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());
create policy vbp_select on public.vendor_bill_payments for select using (tenant_id = current_tenant() and public.can_access_module('accounting','view'));
create policy vbp_write  on public.vendor_bill_payments for all using (tenant_id = current_tenant() and public.is_ceo_or_above()) with check (tenant_id = current_tenant() and public.is_ceo_or_above());

-- ============ updated_at + numeración + balance ============
create trigger trg_updated_at before update on public.vendor_bills for each row execute function public.set_updated_at();

create or replace function public._next_vendor_bill_number(p_tenant_id uuid)
returns text language sql stable security definer set search_path to 'public' as $fn$
  select 'VB-' || lpad((coalesce(max(substring(internal_number from 4)::int), 0) + 1)::text, 4, '0')
  from public.vendor_bills where tenant_id = p_tenant_id;
$fn$;

create or replace function public._vendor_bill_update_balance()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
declare _bill uuid := coalesce(NEW.bill_id, OLD.bill_id); _paid numeric; _total numeric; _status text;
begin
  select coalesce(sum(amount),0) into _paid from public.vendor_bill_payments where bill_id = _bill and voided_at is null;
  select total, status into _total, _status from public.vendor_bills where id = _bill;
  update public.vendor_bills set amount_paid = _paid,
    status = case when _paid >= _total and _total > 0 then 'paid'
                  when _paid > 0 then 'partially_paid'
                  when _status in ('paid','partially_paid') then 'approved'
                  else _status end,
    updated_at = now()
  where id = _bill;
  return coalesce(NEW, OLD);
end $fn$;
create trigger trg_vendor_bill_balance after insert or update or delete on public.vendor_bill_payments
  for each row execute function public._vendor_bill_update_balance();

-- ============ RPCs de AP ============
create or replace function public.create_vendor_bill(
  p_supplier_id uuid, p_bill_number text, p_bill_date date, p_due_date date, p_lines jsonb,
  p_purchase_order_id uuid default null, p_notes text default null
) returns uuid language plpgsql security definer set search_path to 'public' as $fn$
declare _tenant uuid := current_tenant(); _bill uuid; _ln jsonb;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  if p_bill_number is null or btrim(p_bill_number) = '' then raise exception 'BILL_NUMBER_REQUIRED'; end if;
  if p_purchase_order_id is not null and not exists (
     select 1 from public.inventory_purchase_orders where id = p_purchase_order_id and tenant_id = _tenant and supplier_id = p_supplier_id)
     then raise exception 'PO_SUPPLIER_MISMATCH'; end if;
  insert into public.vendor_bills (tenant_id, supplier_id, bill_number, internal_number, bill_date, due_date, status, purchase_order_id, notes)
    values (_tenant, p_supplier_id, p_bill_number, public._next_vendor_bill_number(_tenant), p_bill_date, p_due_date, 'draft', p_purchase_order_id, p_notes)
    returning id into _bill;
  for _ln in select * from jsonb_array_elements(p_lines) loop
    insert into public.vendor_bill_lines (bill_id, tenant_id, description, quantity, unit_price, tax_pct, item_id, po_line_id, category_id, account_id)
      values (_bill, _tenant, coalesce(_ln->>'description','Línea'),
        coalesce((_ln->>'quantity')::numeric,1), coalesce((_ln->>'unit_price')::numeric,0), coalesce((_ln->>'tax_pct')::numeric,0),
        (_ln->>'item_id')::uuid, (_ln->>'po_line_id')::uuid, (_ln->>'category_id')::uuid, (_ln->>'account_id')::uuid);
  end loop;
  update public.vendor_bills b set
    subtotal = coalesce((select sum(subtotal) from public.vendor_bill_lines where bill_id=_bill),0),
    tax_amount = coalesce((select sum(tax) from public.vendor_bill_lines where bill_id=_bill),0),
    total = coalesce((select sum(total) from public.vendor_bill_lines where bill_id=_bill),0)
  where b.id = _bill;
  return _bill;
end $fn$;
grant execute on function public.create_vendor_bill(uuid,text,date,date,jsonb,uuid,text) to authenticated;

create or replace function public.create_vendor_bill_from_po(
  p_purchase_order_id uuid, p_bill_number text, p_bill_date date, p_due_date date
) returns uuid language plpgsql security definer set search_path to 'public' as $fn$
declare _tenant uuid := current_tenant(); _po public.inventory_purchase_orders%rowtype; _lines jsonb;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select * into _po from public.inventory_purchase_orders where id = p_purchase_order_id and tenant_id = _tenant;
  if not found then raise exception 'PO_NOT_FOUND'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'description', coalesce(it.name,'Ítem'), 'quantity', greatest(poi.received_qty,0),
      'unit_price', poi.unit_cost, 'tax_pct', 0, 'item_id', poi.item_id, 'po_line_id', poi.id)), '[]'::jsonb)
    into _lines from public.inventory_purchase_order_items poi
    left join public.inventory_items it on it.id = poi.item_id
    where poi.order_id = p_purchase_order_id and poi.received_qty > 0;
  if _lines = '[]'::jsonb then raise exception 'NOTHING_RECEIVED'; end if;
  return public.create_vendor_bill(_po.supplier_id, p_bill_number, p_bill_date, p_due_date, _lines, p_purchase_order_id, 'Generado desde PO #'||_po.order_number);
end $fn$;
grant execute on function public.create_vendor_bill_from_po(uuid,text,date,date) to authenticated;

create or replace function public.approve_vendor_bill(p_bill_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $fn$
declare _tenant uuid := current_tenant(); _bill public.vendor_bills%rowtype; _dr jsonb; _direct numeric;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select * into _bill from public.vendor_bills where id = p_bill_id and tenant_id = _tenant for update;
  if not found then raise exception 'BILL_NOT_FOUND'; end if;
  if _bill.status not in ('draft','pending') then raise exception 'NOT_APPROVABLE'; end if;
  update public.vendor_bills set status='approved', approved_at=now(), approved_by=auth.uid() where id = p_bill_id;
  if coalesce((select gl_enabled from public.tenants where id = _tenant), false) then
    select coalesce(jsonb_agg(jsonb_build_object(
        'account_code', case when bl.account_id is not null then a.account_code
                             when bl.category_id is not null then public._category_to_account_code(bl.category_id)
                             else '6900' end,
        'debit', bl.total, 'credit', 0, 'description', bl.description)), '[]'::jsonb), coalesce(sum(bl.total),0)
      into _dr, _direct
      from public.vendor_bill_lines bl left join public.chart_of_accounts a on a.id = bl.account_id
      where bl.bill_id = p_bill_id and bl.item_id is null;
    if _direct > 0 then
      perform public._gl_post(_tenant, _bill.bill_date, 'Factura proveedor '||_bill.internal_number, 'vendor_bill', p_bill_id,
        _dr || jsonb_build_array(jsonb_build_object('account_code','2110','debit',0,'credit',_direct,'description','Cuenta por pagar')), auth.uid());
    end if;
  end if;
end $fn$;
grant execute on function public.approve_vendor_bill(uuid) to authenticated;

create or replace function public.record_vendor_bill_payment(
  p_bill_id uuid, p_amount numeric, p_payment_date date default current_date,
  p_payment_method_id uuid default null, p_reference text default null, p_notes text default null
) returns uuid language plpgsql security definer set search_path to 'public' as $fn$
declare _tenant uuid := current_tenant(); _bill public.vendor_bills%rowtype; _pay uuid;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select * into _bill from public.vendor_bills where id = p_bill_id and tenant_id = _tenant for update;
  if not found then raise exception 'BILL_NOT_FOUND'; end if;
  if _bill.status not in ('approved','partially_paid') then raise exception 'NOT_PAYABLE'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if round(p_amount,2) > round(_bill.balance,2) then raise exception 'OVERPAYMENT'; end if;
  insert into public.vendor_bill_payments (tenant_id, bill_id, amount, payment_date, payment_method_id, reference, notes)
    values (_tenant, p_bill_id, p_amount, p_payment_date, p_payment_method_id, p_reference, p_notes) returning id into _pay;
  if coalesce((select gl_enabled from public.tenants where id = _tenant), false) then
    perform public._gl_post(_tenant, p_payment_date, 'Pago factura '||_bill.internal_number, 'bill_payment', _pay,
      jsonb_build_array(
        jsonb_build_object('account_code','2110','debit',p_amount,'credit',0,'description','Pago a proveedor'),
        jsonb_build_object('account_code','1119','debit',0,'credit',p_amount,'description','Salida de efectivo')), auth.uid());
  end if;
  return _pay;
end $fn$;
grant execute on function public.record_vendor_bill_payment(uuid,numeric,date,uuid,text,text) to authenticated;

create or replace function public.void_vendor_bill_payment(p_payment_id uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $fn$
declare _tenant uuid := current_tenant();
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  update public.vendor_bill_payments set voided_at=now(), voided_by=auth.uid(), void_reason=coalesce(nullif(btrim(p_reason),''),'Anulado')
    where id = p_payment_id and tenant_id = _tenant and voided_at is null;
  if not found then raise exception 'CANNOT_VOID'; end if;
  update public.journal_entries set status='voided', voided_at=now(), voided_by=auth.uid(), void_reason='Pago de factura anulado'
    where tenant_id = _tenant and source_type='bill_payment' and source_id = p_payment_id and status='posted';
end $fn$;
grant execute on function public.void_vendor_bill_payment(uuid,text) to authenticated;

create or replace function public.void_vendor_bill(p_bill_id uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $fn$
declare _tenant uuid := current_tenant();
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  if exists (select 1 from public.vendor_bill_payments where bill_id = p_bill_id and voided_at is null) then raise exception 'HAS_PAYMENTS'; end if;
  update public.vendor_bills set status='voided', deleted_at=now(), updated_at=now()
    where id = p_bill_id and tenant_id = _tenant and status <> 'voided';
  if not found then raise exception 'BILL_NOT_FOUND'; end if;
  update public.journal_entries set status='voided', voided_at=now(), voided_by=auth.uid(), void_reason=coalesce(nullif(btrim(p_reason),''),'Factura anulada')
    where tenant_id = _tenant and source_type='vendor_bill' and source_id = p_bill_id and status='posted';
end $fn$;
grant execute on function public.void_vendor_bill(uuid,text) to authenticated;

create or replace function public.get_ap_aging()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $fn$
declare _tenant uuid := current_tenant(); _result jsonb;
begin
  if not public.can_access_module('accounting','view') then raise exception 'NOT_AUTHORIZED'; end if;
  with open_bills as (
    select vb.supplier_id, vb.balance as amt, coalesce(s.name,'Sin proveedor') as supplier_name,
      case when vb.due_date >= current_date then 'current'
           when current_date - vb.due_date <= 30 then 'b1_30'
           when current_date - vb.due_date <= 60 then 'b31_60'
           when current_date - vb.due_date <= 90 then 'b61_90'
           else 'b90_plus' end as bucket
    from public.vendor_bills vb left join public.inventory_suppliers s on s.id = vb.supplier_id
    where vb.tenant_id = _tenant and vb.status not in ('draft','paid','voided') and vb.balance > 0
  ), per_supplier as (
    select supplier_id, max(supplier_name) as supplier_name, sum(amt) as outstanding from open_bills group by supplier_id
  )
  select jsonb_build_object(
    'buckets', (select jsonb_build_object(
      'current', coalesce(sum(amt) filter (where bucket='current'),0),
      'b1_30', coalesce(sum(amt) filter (where bucket='b1_30'),0),
      'b31_60', coalesce(sum(amt) filter (where bucket='b31_60'),0),
      'b61_90', coalesce(sum(amt) filter (where bucket='b61_90'),0),
      'b90_plus', coalesce(sum(amt) filter (where bucket='b90_plus'),0)) from open_bills),
    'total_outstanding', (select coalesce(sum(amt),0) from open_bills),
    'by_supplier', coalesce((select jsonb_agg(jsonb_build_object(
      'supplier_id', supplier_id, 'supplier_name', supplier_name, 'outstanding', outstanding) order by outstanding desc) from per_supplier), '[]'::jsonb)
  ) into _result;
  return _result;
end $fn$;
grant execute on function public.get_ap_aging() to authenticated;

create or replace function public.get_supplier_ap(p_supplier_id uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $fn$
declare _tenant uuid := current_tenant(); _result jsonb;
begin
  if not public.can_access_module('accounting','view') then raise exception 'NOT_AUTHORIZED'; end if;
  select jsonb_build_object(
    'supplier_id', p_supplier_id,
    'bills', coalesce((select jsonb_agg(jsonb_build_object(
      'id', vb.id, 'internal_number', vb.internal_number, 'bill_number', vb.bill_number,
      'bill_date', vb.bill_date, 'due_date', vb.due_date, 'status', vb.status,
      'total', vb.total, 'balance', vb.balance, 'days_overdue', greatest(current_date - vb.due_date, 0)) order by vb.due_date)
      from public.vendor_bills vb where vb.tenant_id=_tenant and vb.supplier_id=p_supplier_id and vb.status not in ('draft','paid','voided') and vb.balance > 0), '[]'::jsonb),
    'total_outstanding', coalesce((select sum(balance) from public.vendor_bills
      where tenant_id=_tenant and supplier_id=p_supplier_id and status not in ('draft','paid','voided') and balance > 0),0)
  ) into _result;
  return _result;
end $fn$;
grant execute on function public.get_supplier_ap(uuid) to authenticated;

-- ============ Recepción de PO → Cr 2110 (AP); restock manual → Cr 1119 (como hoy) ============
create or replace function public._gl_post_inventory_movement()
 returns trigger language plpgsql security definer set search_path to 'public' as $fn$
declare _name text; _amt numeric; _cost numeric; _credit_code text;
begin
  if not coalesce((select gl_enabled from public.tenants where id = NEW.tenant_id), false) then return NEW; end if;
  if NEW.movement_type = 'transferencia' then return NEW; end if;
  select name into _name from public.inventory_items where id = NEW.item_id;
  if NEW.movement_type = 'ajuste' then
    _cost := coalesce(NEW.unit_cost, (select avg_cost from public.inventory_items where id = NEW.item_id), 0);
    _amt := round(abs(coalesce(NEW.delta, 0)) * _cost, 2);
    if _amt <= 0 then return NEW; end if;
    if coalesce(NEW.delta, 0) < 0 then
      perform public._gl_post(NEW.tenant_id, NEW.movement_date, 'Ajuste (baja): ' || coalesce(_name,''), 'inventory', NEW.id,
        jsonb_build_array(jsonb_build_object('account_code','7200','debit',_amt,'credit',0),
                          jsonb_build_object('account_code','1130','debit',0,'credit',_amt)), NEW.created_by);
    else
      perform public._gl_post(NEW.tenant_id, NEW.movement_date, 'Ajuste (alta): ' || coalesce(_name,''), 'inventory', NEW.id,
        jsonb_build_array(jsonb_build_object('account_code','1130','debit',_amt,'credit',0),
                          jsonb_build_object('account_code','4300','debit',0,'credit',_amt)), NEW.created_by);
    end if;
    return NEW;
  end if;
  _amt := round(coalesce(NEW.cogs_total, coalesce(NEW.quantity,0) * coalesce(NEW.unit_cost,0)), 2);
  if _amt <= 0 then return NEW; end if;
  if NEW.movement_type = 'entrada' then
    -- AP: entrada desde PO (linked_restock_id apunta a un PO) → Cr 2110 (deuda); restock manual → Cr 1119
    _credit_code := case when NEW.linked_restock_id is not null
        and exists (select 1 from public.inventory_purchase_orders where id = NEW.linked_restock_id and tenant_id = NEW.tenant_id)
      then '2110' else '1119' end;
    perform public._gl_post(NEW.tenant_id, NEW.movement_date, 'Restock: ' || coalesce(_name,'') || ' ×' || NEW.quantity, 'inventory', NEW.id,
      jsonb_build_array(jsonb_build_object('account_code','1130','debit',_amt,'credit',0),
                        jsonb_build_object('account_code',_credit_code,'debit',0,'credit',_amt)), NEW.created_by);
  elsif NEW.movement_type in ('salida','venta_publica') then
    perform public._gl_post(NEW.tenant_id, NEW.movement_date,
      (case NEW.movement_type when 'salida' then 'Consumo: ' else 'Venta: ' end) || coalesce(_name,''), 'inventory', NEW.id,
      jsonb_build_array(jsonb_build_object('account_code','5100','debit',_amt,'credit',0),
                        jsonb_build_object('account_code','1130','debit',0,'credit',_amt)), NEW.created_by);
  elsif NEW.movement_type = 'merma' then
    perform public._gl_post(NEW.tenant_id, NEW.movement_date, 'Merma: ' || coalesce(_name,''), 'inventory', NEW.id,
      jsonb_build_array(jsonb_build_object('account_code','7200','debit',_amt,'credit',0),
                        jsonb_build_object('account_code','1130','debit',0,'credit',_amt)), NEW.created_by);
  elsif NEW.movement_type = 'devolucion' then
    perform public._gl_post(NEW.tenant_id, NEW.movement_date, 'Devolución: ' || coalesce(_name,''), 'inventory', NEW.id,
      jsonb_build_array(jsonb_build_object('account_code','1130','debit',_amt,'credit',0),
                        jsonb_build_object('account_code','5100','debit',0,'credit',_amt)), NEW.created_by);
  end if;
  return NEW;
end $fn$;

-- ============ AP timing fix: record_restock setea linked_restock_id EN el insert ============
-- El trigger GL (AFTER INSERT) debe ver el PO id al momento del insert. Antes receive_purchase_order lo seteaba
-- por UPDATE post-insert → el trigger veía NULL y posteaba Cr 1119. Ahora record_restock lo recibe y lo inserta.
drop function if exists public.record_restock(uuid,numeric,numeric,text,text,date,uuid,uuid,text,date,date);
create or replace function public.record_restock(p_item_id uuid, p_quantity numeric, p_unit_cost numeric, p_supplier text default null::text, p_notes text default null::text, p_date date default current_date, p_supplier_id uuid default null::uuid, p_warehouse_id uuid default null::uuid, p_lot_number text default null::text, p_expiry_date date default null::date, p_manufacture_date date default null::date, p_purchase_order_id uuid default null::uuid)
 returns uuid language plpgsql security definer set search_path to 'public' as $fn$
declare _tenant uuid := current_tenant(); _item public.inventory_items%rowtype; _mv_id uuid; _base_avg numeric; _new_avg numeric; _wh uuid; _lot_id uuid;
begin
  if p_quantity is null or p_quantity <= 0 then raise exception 'Cantidad inválida'; end if;
  if p_unit_cost is null or p_unit_cost < 0 then raise exception 'Costo inválido'; end if;
  select * into _item from public.inventory_items where id = p_item_id and tenant_id = _tenant for update;
  if not found then raise exception 'Item no encontrado'; end if;
  _wh := coalesce(p_warehouse_id, public._default_warehouse(_tenant));
  if _wh is null then raise exception 'No hay almacén configurado'; end if;
  _base_avg := coalesce(nullif(_item.avg_cost, 0), nullif(_item.unit_cost, 0), p_unit_cost);
  _new_avg := case when _item.stock + p_quantity > 0 then ((_base_avg * _item.stock) + (p_unit_cost * p_quantity)) / (_item.stock + p_quantity) else p_unit_cost end;
  if _item.tracking_type = 'none' then
    if public._costing_method(_tenant) = 'fifo' then
      insert into public.inventory_lots (tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, received_date, unit_cost, supplier_id, status)
        values (_tenant, p_item_id, _wh, 'CL-'||to_char(coalesce(p_date, current_date),'YYYYMMDD')||'-'||substr(gen_random_uuid()::text,1,8), 'cost_layer', p_quantity, coalesce(p_date, current_date), p_unit_cost, coalesce(p_supplier_id, _item.supplier_id), 'available') returning id into _lot_id;
      insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, supplier_id, warehouse_id, lot_id, linked_restock_id)
        values (_tenant, p_item_id, 'entrada', p_quantity, p_unit_cost, p_notes, auth.uid(), p_date, p_supplier_id, _wh, _lot_id, p_purchase_order_id) returning id into _mv_id;
    else
      insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, supplier_id, warehouse_id, linked_restock_id)
        values (_tenant, p_item_id, 'entrada', p_quantity, p_unit_cost, p_notes, auth.uid(), p_date, p_supplier_id, _wh, p_purchase_order_id) returning id into _mv_id;
      perform public._add_warehouse_stock(_tenant, p_item_id, _wh, p_quantity);
    end if;
  else
    if p_lot_number is null or btrim(p_lot_number) = '' then raise exception 'Lote/serie requerido para este ítem'; end if;
    if _item.tracking_type = 'serial' then
      if p_quantity <> 1 then raise exception 'Ítem serializado: la cantidad debe ser 1'; end if;
      insert into public.inventory_lots (tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, expiry_date, manufacture_date, supplier_id, unit_cost, received_date)
        values (_tenant, p_item_id, _wh, p_lot_number, 'serial', 1, p_expiry_date, p_manufacture_date, coalesce(p_supplier_id, _item.supplier_id), p_unit_cost, p_date) returning id into _lot_id;
    else
      insert into public.inventory_lots (tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, expiry_date, manufacture_date, supplier_id, unit_cost, received_date)
        values (_tenant, p_item_id, _wh, p_lot_number, 'lot', p_quantity, p_expiry_date, p_manufacture_date, coalesce(p_supplier_id, _item.supplier_id), p_unit_cost, p_date)
        on conflict (tenant_id, item_id, warehouse_id, lot_number) do update set quantity = public.inventory_lots.quantity + p_quantity,
          expiry_date = coalesce(excluded.expiry_date, public.inventory_lots.expiry_date), manufacture_date = coalesce(excluded.manufacture_date, public.inventory_lots.manufacture_date),
          unit_cost = coalesce(excluded.unit_cost, public.inventory_lots.unit_cost),
          status = case when public.inventory_lots.status = 'consumed' then 'available' else public.inventory_lots.status end, updated_at = now()
        returning id into _lot_id;
    end if;
    insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, notes, created_by, movement_date, supplier_id, warehouse_id, lot_id, linked_restock_id)
      values (_tenant, p_item_id, 'entrada', p_quantity, p_unit_cost, p_notes, auth.uid(), p_date, p_supplier_id, _wh, _lot_id, p_purchase_order_id) returning id into _mv_id;
  end if;
  update public.inventory_items set avg_cost = round(_new_avg, 2), unit_cost = p_unit_cost, last_restock_date = now(),
    supplier_name = coalesce(p_supplier, supplier_name), supplier_id = coalesce(p_supplier_id, supplier_id), updated_at = now()
  where id = p_item_id and tenant_id = _tenant;
  perform public._recalc_item_total_stock(p_item_id);
  return _mv_id;
end $fn$;

create or replace function public.receive_purchase_order(p_order_id uuid, p_items jsonb, p_warehouse_id uuid default null::uuid)
 returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _tenant uuid := current_tenant(); _po public.inventory_purchase_orders%rowtype; _it jsonb; _item_id uuid; _rq numeric; _cost numeric; _all boolean; _wh uuid;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select * into _po from public.inventory_purchase_orders where id = p_order_id and tenant_id = _tenant for update;
  if not found then raise exception 'Orden no encontrada'; end if;
  _wh := coalesce(p_warehouse_id, _po.warehouse_id, public._default_warehouse(_tenant));
  for _it in select * from jsonb_array_elements(p_items) loop
    _item_id := (_it->>'item_id')::uuid; _rq := coalesce((_it->>'received_qty')::numeric, 0);
    if _rq <= 0 then continue; end if;
    select unit_cost into _cost from public.inventory_purchase_order_items where order_id = p_order_id and item_id = _item_id;
    if _cost is null then continue; end if;
    update public.inventory_purchase_order_items set received_qty = received_qty + _rq where order_id = p_order_id and item_id = _item_id;
    -- p_purchase_order_id → el movimiento nace con linked_restock_id seteado → el trigger GL postea Cr 2110 (AP)
    perform public.record_restock(_item_id, _rq, _cost, null, 'Recepción PO', current_date, _po.supplier_id, _wh, nullif(_it->>'lot_number',''), (_it->>'expiry_date')::date, (_it->>'manufacture_date')::date, p_order_id);
  end loop;
  select bool_and(received_qty >= quantity) into _all from public.inventory_purchase_order_items where order_id = p_order_id;
  update public.inventory_purchase_orders set status = case when _all then 'received' else 'partial' end,
    received_at = case when _all then now() else received_at end, updated_at = now() where id = p_order_id;
  return jsonb_build_object('status', case when _all then 'received' else 'partial' end);
end $fn$;
