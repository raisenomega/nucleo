-- 20260705000019_expense_write_rls.sql
-- Slice #4 Gastos: evidencia + RLS de escritura para expenses + defaults desde el JWT.
-- Storage: el bucket "evidence" ya es tenant-scoped por ruta ({tenant_id}/...), sirve para
-- expenses SIN cambios en storage.objects (las policies validan tenant, no tabla).

alter table public.expenses add column evidence_urls jsonb not null default '[]'::jsonb;
alter table public.expenses alter column tenant_id set default public.current_tenant();
alter table public.expenses alter column created_by set default auth.uid();

create policy expenses_insert_authenticated on public.expenses
  for insert to authenticated with check ( tenant_id = public.current_tenant() );
create policy expenses_update_own on public.expenses
  for update to authenticated using ( tenant_id = public.current_tenant() );
create policy expenses_delete_own on public.expenses
  for delete to authenticated using ( tenant_id = public.current_tenant() );
