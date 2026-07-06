-- 20260706000053_categories_write.sql
-- Habilita crear/editar categorías desde el cliente (antes solo se sembraban vía funciones).
-- Necesario para crear una categoría de gasto fijo inline en /expenses-recurring.
-- Patrón: default tenant_id + INSERT/UPDATE tenant-scoped.

alter table public.categories alter column tenant_id set default public.current_tenant();
create policy categories_tenant_insert on public.categories
  for insert to authenticated with check ( tenant_id = public.current_tenant() );
create policy categories_tenant_update on public.categories
  for update to authenticated using ( tenant_id = public.current_tenant() );
