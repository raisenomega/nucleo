-- categories-recurring.fix — el owner creó la categoría "Compra inventario" desde el form de gasto fijo recurrente
-- (que filtra el CategoryPicker a expense_class='fixed'), pero el picker la guardó como 'variable' → no aparecía en
-- ese dropdown. El bug de código (CategoryPicker ignoraba el prop expenseClass al crear) se corrige en el mismo
-- commit; aquí se reclasifica el dato ya creado a 'fixed' para que el owner la vea donde la buscó. Scoped, idempotente.

update public.categories
set expense_class = 'fixed'
where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310'
  and kind = 'expense'
  and label = 'Compra inventario';
