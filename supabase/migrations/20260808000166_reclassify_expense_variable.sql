-- categories-filter — corrección de datos: Dieta/Gasolina/Diesel estaban clasificadas como `fixed` cuando son
-- gastos operativos/variables. Afectaba el break-even (fijos vs variables) y el filtro del CategoryPicker por rol
-- (el empleado de operaciones solo ve categorías `variable`). Reclasificar a `variable`.
-- Scoped al tenant Zafacones; idempotente (re-aplicar no cambia nada).

update public.categories
set expense_class = 'variable'
where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310'
  and kind = 'expense'
  and label in ('Dieta', 'Gasolina', 'Diesel');
