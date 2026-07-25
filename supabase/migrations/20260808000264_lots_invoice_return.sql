-- 20260808000264 · Lotes — devolución de factura de ítem con trazabilidad
-- Antes: _apply_invoice_stock hacía RAISE en devolución (_return=true) de ítems tracking!=none.
-- Ahora: crea un LOTE DE DEVOLUCIÓN (DEV-<factura>-<hash>, lot_type='lot' = batch de retorno, status available).
-- Más simple que rastrear el lote original (requeriría lot_id en invoice_line_items). El trigger _sync_lot_stock
-- recalcula inventory_stock + total. lot_type='lot' evita el CHECK de serial (qty<=1) y admite devoluciones múltiples.

create or replace function public._apply_invoice_stock(_invoice_id uuid, _return boolean)
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare _inv record; _line record; _item_id uuid; _cogs numeric; _iname text; _track text; _wh uuid; _wq numeric; _lot_id uuid;
  _mtype text := case when _return then 'devolucion' else 'venta_publica' end;
begin
  select id, tenant_id, invoice_number into _inv from public.invoices where id = _invoice_id;
  if not found then return; end if;
  _wh := public._default_warehouse(_inv.tenant_id);
  for _line in select product_id, quantity from public.invoice_line_items where invoice_id = _invoice_id and product_id is not null loop
    select id, coalesce(avg_cost, unit_cost, 0), name, tracking_type into _item_id, _cogs, _iname, _track from public.inventory_items
      where landing_product_id = _line.product_id and tenant_id = _inv.tenant_id for update;
    if _item_id is null then continue; end if;
    if _track = 'none' then
      select quantity into _wq from public.inventory_stock where item_id = _item_id and warehouse_id = _wh for update;
      if not _return and coalesce(_wq, 0) - _line.quantity < 0 then
        raise exception 'Stock insuficiente para %: disponible %, requerido %', _iname, coalesce(_wq, 0), _line.quantity;
      end if;
      insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, created_by, warehouse_id)
        values (_inv.tenant_id, _item_id, _mtype, _line.quantity, _cogs, current_date,
          (case when _return then 'Reversa factura #' else 'Venta factura #' end) || coalesce(_inv.invoice_number, ''), auth.uid(), _wh);
      perform public._add_warehouse_stock(_inv.tenant_id, _item_id, _wh, case when _return then _line.quantity else -_line.quantity end);
      perform public._recalc_item_total_stock(_item_id);
    elsif not _return then
      perform public._deduct_fefo(_inv.tenant_id, _item_id, _wh, _line.quantity, 'venta_publica', 'Venta factura #'||coalesce(_inv.invoice_number,''), null, null);
    else
      _lot_id := gen_random_uuid();
      insert into public.inventory_lots (id, tenant_id, item_id, warehouse_id, lot_number, lot_type, quantity, unit_cost, status, notes)
        values (_lot_id, _inv.tenant_id, _item_id, _wh, 'DEV-'||coalesce(_inv.invoice_number,'?')||'-'||substr(_lot_id::text,1,8), 'lot', _line.quantity, _cogs, 'available', 'Devolución factura #'||coalesce(_inv.invoice_number,''));
      insert into public.inventory_movements (tenant_id, item_id, movement_type, quantity, unit_cost, movement_date, notes, created_by, warehouse_id, lot_id)
        values (_inv.tenant_id, _item_id, 'devolucion', _line.quantity, _cogs, current_date, 'Reversa factura #'||coalesce(_inv.invoice_number,''), auth.uid(), _wh, _lot_id);
    end if;
  end loop;
end $function$;
