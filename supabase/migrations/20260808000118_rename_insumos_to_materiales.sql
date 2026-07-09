-- 20260808000118_rename_insumos_to_materiales.sql
-- Cosmético: renombra la categoría de gasto seed 'Insumos' -> 'Materiales'.
-- Solo toca seeds (WHERE label='Insumos'); un tenant que la renombró a mano queda intacto.

-- 1) Seed: futuros tenants nacen con 'Materiales' (único cambio vs la versión actual).
create or replace function private._seed_trial_tenant(_tenant_id uuid)
returns void language plpgsql security definer set search_path to 'public','pg_temp' as $$
begin
  insert into public.settings (tenant_id, key, value) values
    (_tenant_id, 'order_prefix', to_jsonb('TR'::text)),
    (_tenant_id, 'retention_enabled', to_jsonb(false))
  on conflict (tenant_id, key) do nothing;
  insert into public.tenant_themes (tenant_id) values (_tenant_id) on conflict (tenant_id) do nothing;  -- fila NULL = hereda
  insert into public.categories (tenant_id, kind, label, sort) values
    (_tenant_id,'income','Ventas',1),(_tenant_id,'income','Servicios',2),(_tenant_id,'income','Otros ingresos',3),
    (_tenant_id,'expense','Nómina',1),(_tenant_id,'expense','Materiales',2),(_tenant_id,'expense','Renta',3),
    (_tenant_id,'payment_method','Efectivo',1),(_tenant_id,'payment_method','Transferencia',2),
    (_tenant_id,'support_category','IT',1),(_tenant_id,'support_category','RRHH',2),(_tenant_id,'support_category','Operaciones',3),
    (_tenant_id,'support_category','Instalaciones',4),(_tenant_id,'support_category','Otro',5);
end; $$;

-- 2) Tenants existentes seeded (los 4): renombra la categoría.
update public.categories set label = 'Materiales' where label = 'Insumos' and kind = 'expense';
