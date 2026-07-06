-- 20260706000051_trial_recurring.sql
-- create_trial_tenant v6: + categoría Seguro (fixed) + 3 gastos fijos recurrentes demo (Renta, Servicios, Seguro a $0).
-- Reemplaza la v5 (00046) añadiendo el seed de recurring_expenses tras los presets.

create or replace function public.create_trial_tenant(
  name text, email text, business_name text, phone text
) returns jsonb language plpgsql security definer
set search_path = public as $$
declare
  _uid uuid;
  _tenant uuid;
  _slug text := trim(both '-' from lower(regexp_replace(business_name, '[^a-z0-9]+', '-', 'gi')))
                || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
begin
  select u.id into _uid from auth.users u where u.email = create_trial_tenant.email;
  if _uid is null then
    return jsonb_build_object('error', 'auth user no encontrado; signUp primero');
  end if;

  insert into public.tenants (slug, legal_name, status, expires_at)
    values (_slug, business_name, 'trial', now() + interval '3 days')
    returning id into _tenant;

  insert into public.profiles (id, tenant_id, email, full_name, status)
    values (_uid, _tenant, create_trial_tenant.email, name, 'approved');

  insert into public.user_roles (tenant_id, user_id, role) values (_tenant, _uid, 'ceo');

  insert into public.categories (tenant_id, kind, label, sort) values
    (_tenant,'income','Ventas',1),(_tenant,'income','Servicios',2),(_tenant,'income','Otros ingresos',3),
    (_tenant,'expense','Nómina',1),(_tenant,'expense','Insumos',2),(_tenant,'expense','Renta',3),(_tenant,'expense','Seguro',6),
    (_tenant,'payment_method','Efectivo',1),(_tenant,'payment_method','Transferencia',2),
    (_tenant,'lead_source','Facebook',1),(_tenant,'lead_source','Instagram',2),(_tenant,'lead_source','Google',3),
    (_tenant,'lead_source','WhatsApp',4),(_tenant,'lead_source','Referido',5),(_tenant,'lead_source','Otro',6),
    (_tenant,'service_type','Instalación',1),(_tenant,'service_type','Mantenimiento',2),
    (_tenant,'service_type','Reparación',3),(_tenant,'service_type','Consultoría',4),
    (_tenant,'channel','Facebook Ads',1),(_tenant,'channel','Instagram Ads',2),(_tenant,'channel','Google Ads',3),
    (_tenant,'channel','TikTok Ads',4),(_tenant,'channel','Email Marketing',5),(_tenant,'channel','WhatsApp',6),
    (_tenant,'channel','Referidos',7),(_tenant,'channel','Eventos',8),(_tenant,'channel','Otro',9);

  insert into public.settings (tenant_id, key, value) values
    (_tenant, 'order_prefix', to_jsonb('TR'::text)),
    (_tenant, 'retention_enabled', to_jsonb(false)),
    (_tenant, 'contact_phone', to_jsonb(phone));

  perform public.seed_pr_fiscal_preset(_tenant);
  perform public.seed_pr_payroll_preset(_tenant);

  update public.categories set expense_class='fixed' where tenant_id=_tenant and kind='expense' and label='Seguro';
  insert into public.recurring_expenses (tenant_id, category_id, label, budgeted_amount)
  select _tenant, c.id, c.label, 0 from public.categories c
  where c.tenant_id=_tenant and c.kind='expense' and c.label in ('Renta','Servicios','Seguro');

  return jsonb_build_object('tenant_id', _tenant);
end; $$;

grant execute on function public.create_trial_tenant(text,text,text,text) to authenticated;
