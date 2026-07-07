-- 20260722000080_write_owner_scope.sql
-- AUTORIZACIÓN (medio): tras la migr 65, UPDATE/DELETE se gatea por can_access_module pero NO por
-- created_by. El SELECT (migr 68) sí restringe a "propios" para roles < coo -> asimetría: un empleado
-- con <modulo>.edit podía modificar/borrar registros que ni siquiera puede ver.
-- Fix: coo+ siguen viendo/editando todo el tenant; roles < coo solo tocan lo que crearon.
-- Tablas con created_by: income, expenses, extraordinary_payments, payroll, leads.

drop policy if exists income_module_update on public.income;
create policy income_module_update on public.income for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('income','edit')
    and (public.is_coo_or_above() or created_by = auth.uid()));
drop policy if exists income_module_delete on public.income;
create policy income_module_delete on public.income for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('income','delete')
    and (public.is_coo_or_above() or created_by = auth.uid()));

drop policy if exists expenses_module_update on public.expenses;
create policy expenses_module_update on public.expenses for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('expenses','edit')
    and (public.is_coo_or_above() or created_by = auth.uid()));
drop policy if exists expenses_module_delete on public.expenses;
create policy expenses_module_delete on public.expenses for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('expenses','delete')
    and (public.is_coo_or_above() or created_by = auth.uid()));

drop policy if exists extraordinary_module_update on public.extraordinary_payments;
create policy extraordinary_module_update on public.extraordinary_payments for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('extraordinary','edit')
    and (public.is_coo_or_above() or created_by = auth.uid()));
drop policy if exists extraordinary_module_delete on public.extraordinary_payments;
create policy extraordinary_module_delete on public.extraordinary_payments for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('extraordinary','delete')
    and (public.is_coo_or_above() or created_by = auth.uid()));

drop policy if exists payroll_module_update on public.payroll;
create policy payroll_module_update on public.payroll for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('payroll','edit')
    and (public.is_coo_or_above() or created_by = auth.uid()));
drop policy if exists payroll_module_delete on public.payroll;
create policy payroll_module_delete on public.payroll for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('payroll','delete')
    and (public.is_coo_or_above() or created_by = auth.uid()));

drop policy if exists leads_module_update on public.leads;
create policy leads_module_update on public.leads for update to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('leads','edit')
    and (public.is_coo_or_above() or created_by = auth.uid()));
drop policy if exists leads_module_delete on public.leads;
create policy leads_module_delete on public.leads for delete to authenticated
  using (tenant_id = current_tenant() and public.can_access_module('leads','delete')
    and (public.is_coo_or_above() or created_by = auth.uid()));
