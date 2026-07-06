-- 20260705000038_retention_write.sql
-- Conciliación (Sub-slice B): habilitar escritura de retention_deposits desde el cliente.
-- 00005 solo dejó SELECT ("escritura = service_role"). Patrón: default tenant_id + created_by + INSERT tenant-scoped.

alter table public.retention_deposits alter column tenant_id set default public.current_tenant();
alter table public.retention_deposits alter column created_by set default auth.uid();
create policy retention_deposits_insert on public.retention_deposits
  for insert to authenticated with check ( tenant_id = public.current_tenant() );
