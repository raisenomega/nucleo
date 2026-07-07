-- 20260724000087_auto_expense_on_inventory_entry.sql
-- PUENTE DE AUTO-CONTABILIDAD (2/6): compra de inventario (movement_type='entrada') -> gasto automático.
-- SECURITY DEFINER porque quien registra el movimiento (servicio/operaciones) no tiene expenses.create.
-- expenses.payment_method_id es NOT NULL -> busca/crea 'Efectivo'. Usa `notes` (no existe `description`)
-- y enlaza vía `linked_inventory_movement_id`. Categoría 'Inventario' (kind=expense, class=variable).

create or replace function public.auto_expense_on_inventory_entry()
returns trigger language plpgsql security definer set search_path = public as $$
declare _cat uuid; _pm uuid; _name text; _amt numeric;
begin
  _amt := coalesce(NEW.quantity, 0) * coalesce(NEW.unit_cost, 0);
  if _amt <= 0 then return NEW; end if;
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
end $$;

drop trigger if exists trg_inventory_expense on public.inventory_movements;
create trigger trg_inventory_expense after insert on public.inventory_movements
  for each row when (NEW.movement_type = 'entrada')
  execute function public.auto_expense_on_inventory_entry();
