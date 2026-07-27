-- RRHH-0 TAREA 3: el empleado puede ver SU propia nómina (no la de otros).
-- Antes: is_coo_or_above() OR created_by = auth.uid()  → el empleado no veía su payslip.
-- Ahora: + employee_id = auth.uid()  (nómina interna vinculada al perfil = usuario auth).
-- Los trabajadores externos usan external_worker_id (sin cuenta auth) → siguen COO+.
drop policy if exists payroll_tenant_select on public.payroll;
create policy payroll_tenant_select on public.payroll for select using (
  tenant_id = public.current_tenant() and (
    public.is_coo_or_above() or created_by = auth.uid() or employee_id = auth.uid()
  )
);
