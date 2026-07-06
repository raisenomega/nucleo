-- 20260705000034_fiscal_preset_pr.sql
-- Preset fiscal Puerto Rico 2026 (§5 del doc): 9 categories tax_obligation + 9 reglas + settings.
-- Función reutilizable: la usan los tenants existentes (abajo) y los trials nuevos (00035).

create or replace function public.seed_pr_fiscal_preset(tid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.categories (tenant_id, kind, label, sort) values
    (tid,'tax_obligation','IVU (Impuesto Ventas y Uso)',1),(tid,'tax_obligation','FICA Patronal (Seguro Social)',2),
    (tid,'tax_obligation','Medicare Patronal',3),(tid,'tax_obligation','Desempleo PR (PRUI)',4),
    (tid,'tax_obligation','FUTA (Federal Unemployment)',5),(tid,'tax_obligation','SINOT (Incapacidad Temporal)',6),
    (tid,'tax_obligation','Retención a Contratistas',7),(tid,'tax_obligation','Patente Municipal',8),
    (tid,'tax_obligation','Derecho Anual LLC',9)
  on conflict (tenant_id, kind, label) do nothing;

  insert into public.tax_obligation_rules
    (tenant_id, category_id, calc_type, rate, base_source, wage_cap, per_employee, frequency, notes)
  select tid, c.id, r.calc_type, r.rate, r.base_source, r.wage_cap, r.per_employee, r.frequency, r.notes
  from public.categories c join (values
    ('IVU (Impuesto Ventas y Uso)','percentage',11.5,'gross_income',null::numeric,false,'monthly','Mensual vía SURI. 10.5% estatal + 1% municipal. B2B=4%. Exención PyME si ventas <=$50k/año.'),
    ('FICA Patronal (Seguro Social)','percentage',6.2,'gross_payroll',184500,true,'monthly','Formulario 941/944. Base máx $184,500/año por empleado (2026).'),
    ('Medicare Patronal','percentage',1.45,'gross_payroll',null,true,'monthly','Sin límite de base. +0.9% al empleado si >$200k/año.'),
    ('Desempleo PR (PRUI)','percentage',2.5,'gross_payroll',7000,true,'quarterly','Tasa real 1.0-5.4% según experiencia. Base primeros $7,000/año por empleado.'),
    ('FUTA (Federal Unemployment)','percentage',0.6,'gross_payroll',7000,true,'annual','Efectiva 0.6% (6% - 5.4% crédito). Base primeros $7,000/año por empleado.'),
    ('SINOT (Incapacidad Temporal)','percentage',0.6,'gross_payroll',9000,true,'quarterly','Retención al empleado. Base primeros $9,000/año.'),
    ('Retención a Contratistas','percentage',10.0,'contractor_payments',null,false,'monthly','Sobre pagos >$500 a contratistas. Remitir a Hacienda el día 15 del mes siguiente.'),
    ('Patente Municipal','fixed_amount',0,'fixed',null,false,'annual','Varía por municipio y volumen. Configurar el monto real con el CPA.'),
    ('Derecho Anual LLC','fixed_amount',150,'fixed',null,false,'annual','Derecho anual obligatorio para LLCs: $150/año.')
  ) r(label,calc_type,rate,base_source,wage_cap,per_employee,frequency,notes) on r.label = c.label
  where c.tenant_id = tid and c.kind = 'tax_obligation'
  on conflict (tenant_id, category_id) do nothing;

  insert into public.settings (tenant_id, key, value) values
    (tid,'fiscal_country',to_jsonb('PR'::text)),(tid,'fiscal_preset',to_jsonb('puerto_rico_2026'::text)),
    (tid,'retention_pct',to_jsonb(20)),(tid,'retention_label',to_jsonb('Fondo de Reserva'::text)),
    (tid,'max_bank_accounts',to_jsonb(3))
  on conflict (tenant_id, key) do nothing;
end; $$;
grant execute on function public.seed_pr_fiscal_preset(uuid) to authenticated;

-- Aplicar el preset PR a los tenants que ya existen.
select public.seed_pr_fiscal_preset(id) from public.tenants;
