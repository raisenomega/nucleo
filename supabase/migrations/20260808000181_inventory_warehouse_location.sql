-- inventory-audit-fix — ubicación física en almacén (zona/pasillo/isla/bahía). Solo columnas aditivas de texto.
alter table public.inventory_items
  add column if not exists warehouse_zone text,
  add column if not exists aisle text,
  add column if not exists shelf text,
  add column if not exists bin text;
comment on column public.inventory_items.warehouse_zone is 'Zona/nave del almacén (ej: Nave A, Zona Exterior)';
comment on column public.inventory_items.aisle is 'Pasillo (ej: P1, P2, P3)';
comment on column public.inventory_items.shelf is 'Isla/estante (ej: I1, I2, E3)';
comment on column public.inventory_items.bin is 'Bahía/posición específica (ej: B1, B2, Piso)';
