-- 20260706000045_payroll_preset_pr.sql
-- Preset nómina Puerto Rico (§3.1): 10 reglas de deducción + clasificación de gastos demo.
-- Función reutilizable: tenants existentes (abajo) + trials nuevos (00046).

create or replace function public.seed_pr_payroll_preset(tid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.payroll_deduction_rules (tenant_id, label, applies_to, calc_type, rate, base_source, wage_cap, frequency, country_code, notes, sort) values
    (tid,'FICA Empleado','employee','percentage',6.2,'gross_salary',184500,'per_pay_period','PR','Seguro Social. Cap anual $184,500 (sin tope YTD en v1).',1),
    (tid,'Medicare Empleado','employee','percentage',1.45,'gross_salary',null,'per_pay_period','PR','Sin cap de base.',2),
    (tid,'SINOT','employee','percentage',0.6,'gross_salary',9000,'per_pay_period','PR','Incapacidad. Base primeros $9,000/año.',3),
    (tid,'Contribución PR (ISR)','employee','percentage',0,'gross_salary',null,'per_pay_period','PR','Configurable — tabla progresiva. Consulte su CPA.',4),
    (tid,'FICA Patronal','employer','percentage',6.2,'gross_salary',184500,'per_pay_period','PR','Costo patronal.',5),
    (tid,'Medicare Patronal','employer','percentage',1.45,'gross_salary',null,'per_pay_period','PR','Costo patronal.',6),
    (tid,'Desempleo PR (PRUI)','employer','percentage',2.5,'gross_salary',7000,'per_pay_period','PR','Base primeros $7,000/año (sin tope YTD en v1).',7),
    (tid,'FUTA','employer','percentage',0.6,'gross_salary',7000,'per_pay_period','PR','Base primeros $7,000/año (sin tope YTD en v1).',8),
    (tid,'CFSE','employer','percentage',0,'gross_salary',null,'per_pay_period','PR','Configurable — varía por industria. Consulte su CPA.',9),
    (tid,'Retención Contratista','contractor','percentage',10,'contract_payment',null,'per_pay_period','PR','Sobre pagos >$500. Remitir a Hacienda día 15.',10)
  on conflict (tenant_id, label) do nothing;

  update public.categories set expense_class='fixed'    where tenant_id=tid and kind='expense' and label='Renta';
  update public.categories set expense_class='variable' where tenant_id=tid and kind='expense' and label='Insumos';
  insert into public.categories (tenant_id, kind, label, sort, expense_class) values
    (tid,'expense','Servicios',4,'fixed'),(tid,'expense','Gasolina',5,'variable')
  on conflict (tenant_id, kind, label) do nothing;
end; $$;
grant execute on function public.seed_pr_payroll_preset(uuid) to authenticated;

-- Aplicar el preset de nómina a los tenants que ya existen.
select public.seed_pr_payroll_preset(id) from public.tenants;
