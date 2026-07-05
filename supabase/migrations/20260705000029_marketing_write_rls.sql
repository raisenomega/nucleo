-- 20260705000029_marketing_write_rls.sql
-- Slice Marketing (BC crm): RLS de escritura para budgets + expenses + evidencia en expenses.
-- created_by ya default auth.uid() en ambas. Storage: bucket "evidence" ya tenant-scoped por ruta.

-- marketing_budgets: default tenant_id + RLS escritura (SELECT ya existe de 00007).
alter table public.marketing_budgets alter column tenant_id set default public.current_tenant();
create policy marketing_budgets_insert on public.marketing_budgets
  for insert to authenticated with check ( tenant_id = public.current_tenant() );
create policy marketing_budgets_update on public.marketing_budgets
  for update to authenticated using ( tenant_id = public.current_tenant() );
create policy marketing_budgets_delete on public.marketing_budgets
  for delete to authenticated using ( tenant_id = public.current_tenant() );

-- marketing_expenses: evidencia + default tenant_id + RLS escritura.
alter table public.marketing_expenses add column evidence_urls jsonb not null default '[]'::jsonb;
alter table public.marketing_expenses alter column tenant_id set default public.current_tenant();
create policy marketing_expenses_insert on public.marketing_expenses
  for insert to authenticated with check ( tenant_id = public.current_tenant() );
create policy marketing_expenses_update on public.marketing_expenses
  for update to authenticated using ( tenant_id = public.current_tenant() );
create policy marketing_expenses_delete on public.marketing_expenses
  for delete to authenticated using ( tenant_id = public.current_tenant() );
