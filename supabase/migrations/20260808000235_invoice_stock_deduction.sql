-- 235 · Descuento de stock desde factura (al pagar) + reversa simétrica.
--
-- Cuando una factura MANUAL con líneas de producto pasa a 'paid' (último pago que la salda), descuenta stock de
-- los inventory_items enlazados (por landing_product_id) — replicando el bloque de confirm_landing_order pero
-- leyendo invoice_line_items (2.3a). Si sale de 'paid' (void de pago / cancelación), DEVUELVE el stock (simétrico).
--
-- Trigger AFTER UPDATE OF status: verificado en vivo que el UPDATE interno de stock_deducted_at (otra columna) NO
-- lo re-dispara. Guards: linked_order_id IS NULL (las facturas de landing order se INSERTAN ya 'paid' → un trigger
-- de UPDATE no dispara, y ya descontaron en el checkout) + stock_deducted_at (idempotencia). Reutiliza venta_publica
-- (descuento) / devolucion (reversa) → cero cambios al CHECK / delta-trigger (2.2b) / MOV map. COGS = avg_cost
-- vigente (FOR UPDATE); avg_cost NO cambia (weighted-average). Stock puede quedar negativo (no bloquea el cobro).

-- 1. Idempotencia
alter table public.invoices add column if not exists stock_deducted_at timestamptz;

-- 2. Función compartida: descuenta (_return=false) o devuelve (_return=true) el stock de las líneas de producto.
create or replace function public._apply_invoice_stock(_invoice_id uuid, _return boolean)
returns void language plpgsql security definer set search_path = public as $function$
declare
  _inv record; _line record; _item_id uuid; _cogs numeric; _new_stock numeric;
  _mtype text := case when _return then 'devolucion' else 'venta_publica' end;
begin
  select id, tenant_id, invoice_number into _inv from public.invoices where id = _invoice_id;
  if not found then return; end if;
  for _line in select product_id, quantity from public.invoice_line_items
    where invoice_id = _invoice_id and product_id is not null loop
    select id, coalesce(avg_cost, unit_cost, 0) into _item_id, _cogs from public.inventory_items
      where landing_product_id = _line.product_id and tenant_id = _inv.tenant_id for update;
    if _item_id is null then continue; end if;  -- producto sin inventory_item → no lleva stock
    insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, created_by)
      values (_inv.tenant_id, _item_id, _mtype, _line.quantity, _cogs, current_date,
        (case when _return then 'Reversa factura #' else 'Venta factura #' end) || coalesce(_inv.invoice_number, ''), auth.uid());
    update public.inventory_items
      set stock = stock + (case when _return then _line.quantity else -_line.quantity end), updated_at = now()
      where id = _item_id returning stock into _new_stock;
    update public.tenant_landing_products set stock_quantity = _new_stock, updated_at = now()
      where id = _line.product_id and tenant_id = _inv.tenant_id;
  end loop;
end $function$;
revoke execute on function public._apply_invoice_stock(uuid, boolean) from public, anon, authenticated;

-- 3. Trigger AFTER UPDATE OF status: descuenta al entrar a paid, devuelve al salir de paid.
create or replace function public._invoice_stock_on_status()
returns trigger language plpgsql security definer set search_path = public as $function$
begin
  if new.status = 'paid' and old.status is distinct from 'paid'
     and new.linked_order_id is null and new.stock_deducted_at is null then
    perform public._apply_invoice_stock(new.id, false);
    update public.invoices set stock_deducted_at = now() where id = new.id;
  elsif old.status = 'paid' and new.status is distinct from 'paid' and new.stock_deducted_at is not null then
    perform public._apply_invoice_stock(new.id, true);
    update public.invoices set stock_deducted_at = null where id = new.id;
  end if;
  return null;
end $function$;
drop trigger if exists trg_invoice_stock on public.invoices;
create trigger trg_invoice_stock after update of status on public.invoices
  for each row execute function public._invoice_stock_on_status();
