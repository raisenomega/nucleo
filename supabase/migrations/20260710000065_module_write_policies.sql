-- Enforcement backend: reemplaza las policies de escritura (solo tenant) por policies con gate de modulo.
-- SELECT se mantiene intacto (los RPCs del dashboard leen cross-modulo). Solo INSERT/UPDATE/DELETE.

-- income -> modulo 'income'
drop policy if exists income_insert_authenticated on public.income;
drop policy if exists income_update_own on public.income;
drop policy if exists income_delete_own on public.income;
create policy income_module_insert on public.income for insert to authenticated
  with check (tenant_id = current_tenant() and public.can_access_module('income','create'));
create policy income_module_update on public.income for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('income','edit'));
create policy income_module_delete on public.income for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('income','delete'));

-- expenses -> 'expenses'
drop policy if exists expenses_insert_authenticated on public.expenses;
drop policy if exists expenses_update_own on public.expenses;
drop policy if exists expenses_delete_own on public.expenses;
create policy expenses_module_insert on public.expenses for insert to authenticated
  with check (tenant_id = current_tenant() and public.can_access_module('expenses','create'));
create policy expenses_module_update on public.expenses for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('expenses','edit'));
create policy expenses_module_delete on public.expenses for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('expenses','delete'));

-- extraordinary_payments -> 'extraordinary'
drop policy if exists extraordinary_insert_authenticated on public.extraordinary_payments;
drop policy if exists extraordinary_update_own on public.extraordinary_payments;
drop policy if exists extraordinary_delete_own on public.extraordinary_payments;
create policy extraordinary_module_insert on public.extraordinary_payments for insert to authenticated
  with check (tenant_id = current_tenant() and public.can_access_module('extraordinary','create'));
create policy extraordinary_module_update on public.extraordinary_payments for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('extraordinary','edit'));
create policy extraordinary_module_delete on public.extraordinary_payments for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('extraordinary','delete'));

-- payroll -> 'payroll'
drop policy if exists payroll_insert_authenticated on public.payroll;
drop policy if exists payroll_update_own on public.payroll;
drop policy if exists payroll_delete_own on public.payroll;
create policy payroll_module_insert on public.payroll for insert to authenticated
  with check (tenant_id = current_tenant() and public.can_access_module('payroll','create'));
create policy payroll_module_update on public.payroll for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('payroll','edit'));
create policy payroll_module_delete on public.payroll for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('payroll','delete'));

-- inventory_items -> 'inventory'
drop policy if exists inventory_items_insert on public.inventory_items;
drop policy if exists inventory_items_update on public.inventory_items;
drop policy if exists inventory_items_delete on public.inventory_items;
create policy inventory_module_insert on public.inventory_items for insert to authenticated
  with check (tenant_id = current_tenant() and public.can_access_module('inventory','create'));
create policy inventory_module_update on public.inventory_items for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('inventory','edit'));
create policy inventory_module_delete on public.inventory_items for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('inventory','delete'));

-- leads -> 'leads'
drop policy if exists leads_insert on public.leads;
drop policy if exists leads_update on public.leads;
drop policy if exists leads_delete on public.leads;
create policy leads_module_insert on public.leads for insert to authenticated
  with check (tenant_id = current_tenant() and public.can_access_module('leads','create'));
create policy leads_module_update on public.leads for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('leads','edit'));
create policy leads_module_delete on public.leads for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('leads','delete'));

-- marketing_budgets -> 'marketing'
drop policy if exists marketing_budgets_insert on public.marketing_budgets;
drop policy if exists marketing_budgets_update on public.marketing_budgets;
drop policy if exists marketing_budgets_delete on public.marketing_budgets;
create policy marketing_budgets_module_insert on public.marketing_budgets for insert to authenticated
  with check (tenant_id = current_tenant() and public.can_access_module('marketing','create'));
create policy marketing_budgets_module_update on public.marketing_budgets for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('marketing','edit'));
create policy marketing_budgets_module_delete on public.marketing_budgets for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('marketing','delete'));

-- marketing_expenses -> 'marketing'
drop policy if exists marketing_expenses_insert on public.marketing_expenses;
drop policy if exists marketing_expenses_update on public.marketing_expenses;
drop policy if exists marketing_expenses_delete on public.marketing_expenses;
create policy marketing_expenses_module_insert on public.marketing_expenses for insert to authenticated
  with check (tenant_id = current_tenant() and public.can_access_module('marketing','create'));
create policy marketing_expenses_module_update on public.marketing_expenses for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('marketing','edit'));
create policy marketing_expenses_module_delete on public.marketing_expenses for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('marketing','delete'));
