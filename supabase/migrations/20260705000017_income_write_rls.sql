-- 20260705000017_income_write_rls.sql
-- Slice #3: RLS de escritura para income (INSERT/UPDATE/DELETE tenant-scoped) + defaults desde el JWT.
-- Defaults: el cliente NO manda tenant_id ni created_by; los rellena el JWT (no spoofeable en tenant).

alter table public.income alter column tenant_id set default public.current_tenant();
alter table public.income alter column created_by set default auth.uid();

create policy income_insert_authenticated on public.income
  for insert to authenticated with check ( tenant_id = public.current_tenant() );
create policy income_update_own on public.income
  for update to authenticated using ( tenant_id = public.current_tenant() );
create policy income_delete_own on public.income
  for delete to authenticated using ( tenant_id = public.current_tenant() );
