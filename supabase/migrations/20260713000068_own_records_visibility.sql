-- Visibilidad por creador: coo+ ven todo el tenant; roles < coo solo sus propios registros.
-- Los RPCs del dashboard (get_financial/reconciliation/crm/marketing_snapshot) son SECURITY DEFINER
-- (verificado) -> corren como owner, ignoran esta policy, siguen leyendo todo para KPIs.
drop policy if exists income_tenant_select on public.income;
create policy income_tenant_select on public.income for select to authenticated
  using (tenant_id = current_tenant() and (public.is_coo_or_above() or created_by = auth.uid()));

drop policy if exists expenses_tenant_select on public.expenses;
create policy expenses_tenant_select on public.expenses for select to authenticated
  using (tenant_id = current_tenant() and (public.is_coo_or_above() or created_by = auth.uid()));

drop policy if exists extraordinary_tenant_select on public.extraordinary_payments;
create policy extraordinary_tenant_select on public.extraordinary_payments for select to authenticated
  using (tenant_id = current_tenant() and (public.is_coo_or_above() or created_by = auth.uid()));

drop policy if exists payroll_tenant_select on public.payroll;
create policy payroll_tenant_select on public.payroll for select to authenticated
  using (tenant_id = current_tenant() and (public.is_coo_or_above() or created_by = auth.uid()));
