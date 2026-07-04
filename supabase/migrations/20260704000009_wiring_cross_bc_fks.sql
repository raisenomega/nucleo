-- 20260704000009_wiring_cross_bc_fks.sql
-- Cierra el único FK cross-BC que quedó diferido durante la reescritura por BC.
-- expenses.linked_inventory_movement_id se creó en 00004 (finance), pero inventory_movements
-- se creó en 00006 (fieldops) → no se pudo poner el FK inline. Ahora ambas existen.
-- Verificado: es el ÚNICO linked_* sin FK; los demás quedaron con references en su migración.
-- ON DELETE SET NULL conservado del legacy.

alter table public.expenses
  add constraint expenses_linked_inventory_fk
  foreign key (linked_inventory_movement_id)
  references public.inventory_movements(id)
  on delete set null;
