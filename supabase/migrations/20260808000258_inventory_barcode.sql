-- 20260808000258 · Inventory Gap Fix #4 — Código de barras
-- Campo barcode (texto, cualquier formato: EAN-13/UPC-A/Code128) + unique por tenant + RPC de búsqueda.
-- Aditivo. barcode nullable → los 36 ítems existentes quedan sin código hasta que se les asigne.
-- NOTA: inventory_items NO tiene deleted_at (no es soft-delete) → el RPC NO filtra por deleted_at.
--       Se usa current_tenant() (patrón del resto de RPCs de inventario), no un lookup a profiles.

alter table public.inventory_items add column if not exists barcode text;
-- NULLs son distintos en un UNIQUE de Postgres → varios ítems sin barcode no colisionan.
alter table public.inventory_items add constraint inventory_items_barcode_tenant_unique unique (tenant_id, barcode);

-- Búsqueda por barcode dentro del tenant del usuario. STABLE, no escribe. DEFINER + tenant explícito.
create or replace function public.find_item_by_barcode(p_barcode text)
 returns uuid language sql stable security definer set search_path to 'public'
as $$
  select id from public.inventory_items
  where tenant_id = current_tenant() and barcode = p_barcode
  limit 1;
$$;
