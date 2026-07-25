-- GL · Inventario perpetuo — resuelve el DOBLE-CONTEO (Ola 3 · Sesión C3, trampa #1)
-- Bajo gl_enabled=true: auto_expense_on_inventory_entry se SUPRIME (no crea gasto) y el inventario
-- se contabiliza como ACTIVO (Dr 1130 al comprar; Dr 5100 COGS al vender/consumir).
-- Bajo gl_enabled=false: comportamiento idéntico al actual (backward-compat).
-- Diseño: docs-nucleo/ARQUITECTURA-GL-NUCLEO.md §3.4.

-- ============ TAREA 1 · suprimir auto_expense bajo GL ============
create or replace function public.auto_expense_on_inventory_entry()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare _cat uuid; _pm uuid; _name text; _amt numeric;
begin
  -- GL activo → el inventario se maneja como activo (Dr 1130), NO como gasto. No crear expense.
  if exists (select 1 from public.tenants where id = NEW.tenant_id and gl_enabled) then return NEW; end if;
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

-- ============ TAREA 2 · posting GL de movimientos de inventario ============
-- entrada→Dr 1130/Cr 1119 · salida/venta→Dr 5100/Cr 1130 · merma→Dr 7200/Cr 1130
-- ajuste(-)→Dr 7200/Cr 1130 · ajuste(+)→Dr 1130/Cr 4300 · devolucion→Dr 1130/Cr 5100 · transferencia→sin asiento
create or replace function public._gl_post_inventory_movement()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare _name text; _amt numeric; _cost numeric;
begin
  if not coalesce((select gl_enabled from public.tenants where id = NEW.tenant_id), false) then return NEW; end if;
  if NEW.movement_type = 'transferencia' then return NEW; end if;  -- el total no cambia, solo se mueve
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

  -- resto: monto = cogs_total si existe (fifo), si no qty × unit_cost (promedio)
  _amt := round(coalesce(NEW.cogs_total, coalesce(NEW.quantity,0) * coalesce(NEW.unit_cost,0)), 2);
  if _amt <= 0 then return NEW; end if;

  if NEW.movement_type = 'entrada' then
    perform public._gl_post(NEW.tenant_id, NEW.movement_date, 'Restock: ' || coalesce(_name,'') || ' ×' || NEW.quantity, 'inventory', NEW.id,
      jsonb_build_array(jsonb_build_object('account_code','1130','debit',_amt,'credit',0),
                        jsonb_build_object('account_code','1119','debit',0,'credit',_amt)), NEW.created_by);
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
end $function$;

drop trigger if exists trg_gl_post_inventory on public.inventory_movements;
create trigger trg_gl_post_inventory after insert on public.inventory_movements
  for each row execute function public._gl_post_inventory_movement();
