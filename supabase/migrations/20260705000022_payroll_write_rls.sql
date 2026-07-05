-- 20260705000022_payroll_write_rls.sql
-- Slice #7 Nómina: evidencia + RLS de escritura + defaults desde el JWT.
-- Nota: payroll clasifica por employee_id (→ profiles) + period (ENUM), no por category.
-- Los empleados se leen de profiles (RLS profiles_tenant_select ya lo permite). Storage sin cambios.

alter table public.payroll add column evidence_urls jsonb not null default '[]'::jsonb;
alter table public.payroll alter column tenant_id set default public.current_tenant();
alter table public.payroll alter column created_by set default auth.uid();

create policy payroll_insert_authenticated on public.payroll
  for insert to authenticated with check ( tenant_id = public.current_tenant() );
create policy payroll_update_own on public.payroll
  for update to authenticated using ( tenant_id = public.current_tenant() );
create policy payroll_delete_own on public.payroll
  for delete to authenticated using ( tenant_id = public.current_tenant() );
