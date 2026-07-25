-- 20260808000261 · Limpieza post-deploy — DROP del transfer_stock legacy (7-arg)
-- El frontend nuevo (076005a, ya desplegado) usa el overload REAL de 5-arg
-- (uuid, numeric, uuid, uuid, text). El viejo de 7-arg (uuid, numeric, text×5) solo re-etiquetaba
-- ubicación y ya no lo llama nadie (grep: 0 referencias en apps/web/src). Se elimina.
-- NO se tocan las columnas legacy warehouse_zone/aisle/shelf/bin de inventory_items: aún se leen
-- (mapper, types, InventoryTable, inventory-report, form) y el trigger _seed_item_stock las usa.

drop function if exists public.transfer_stock(uuid, numeric, text, text, text, text, text);
