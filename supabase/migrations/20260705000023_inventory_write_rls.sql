-- 20260705000023_inventory_write_rls.sql
-- Slice #8 Inventario (catálogo): RLS de escritura para inventory_items + default tenant_id.
-- Catálogo puro: sin created_by (la tabla no lo tiene), sin evidencia. SELECT ya existe de 00006.

alter table public.inventory_items alter column tenant_id set default public.current_tenant();

create policy inventory_items_insert on public.inventory_items
  for insert to authenticated with check ( tenant_id = public.current_tenant() );
create policy inventory_items_update on public.inventory_items
  for update to authenticated using ( tenant_id = public.current_tenant() );
create policy inventory_items_delete on public.inventory_items
  for delete to authenticated using ( tenant_id = public.current_tenant() );
