-- hero-principal.debug — el hero principal del home no reflejaba los cambios guardados desde Ajustes del sitio.
-- Causa raíz: tenant_landing_config no tenía fila para NINGÚN tenant (7/7 vacíos). El provisioning
-- (create_trial_tenant → private._seed_trial_tenant) nunca creaba la fila, y sin fila el RPC
-- _public_get_landing_home retorna hero=null → HeroFlat cae al fallback (display_name + i18n) y HeroMedia
-- pinta el gradiente. El pipeline panel→DB→RPC→render y las RLS/JWT están correctos (upsert probado OK con
-- las claims reales del CEO); sólo faltaba la fila.
--
-- Fix (2 partes):
-- 1) Backfill idempotente: sembrar una fila por tenant que no la tenga (hero_title = display_name/legal_name).
-- 2) Recurrencia: private._seed_trial_tenant ahora crea la fila para futuros tenants.

-- 1) Backfill de tenants existentes
insert into public.tenant_landing_config (tenant_id, hero_title, hero_cta_type)
select t.id, coalesce(nullif(trim(t.display_name), ''), nullif(trim(t.legal_name), ''), 'Bienvenido'), 'quote'
from public.tenants t
left join public.tenant_landing_config c on c.tenant_id = t.id
where c.tenant_id is null;

-- 2) Provisioning: añadir el seed de tenant_landing_config al seeder de trials
create or replace function private._seed_trial_tenant(_tenant_id uuid)
 returns void language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
begin
  insert into public.settings (tenant_id, key, value) values
    (_tenant_id, 'order_prefix', to_jsonb('TR'::text)),
    (_tenant_id, 'retention_enabled', to_jsonb(false))
  on conflict (tenant_id, key) do nothing;
  insert into public.tenant_themes (tenant_id) values (_tenant_id) on conflict (tenant_id) do nothing;  -- fila NULL = hereda
  insert into public.tenant_landing_config (tenant_id, hero_title, hero_cta_type)
    select _tenant_id, coalesce(nullif(trim(t.display_name), ''), nullif(trim(t.legal_name), ''), 'Bienvenido'), 'quote'
    from public.tenants t where t.id = _tenant_id
    on conflict (tenant_id) do nothing;
  insert into public.categories (tenant_id, kind, label, sort) values
    (_tenant_id,'income','Ventas',1),(_tenant_id,'income','Servicios',2),(_tenant_id,'income','Otros ingresos',3),
    (_tenant_id,'expense','Nómina',1),(_tenant_id,'expense','Materiales',2),(_tenant_id,'expense','Renta',3),
    (_tenant_id,'payment_method','Efectivo',1),(_tenant_id,'payment_method','Transferencia',2),
    (_tenant_id,'support_category','IT',1),(_tenant_id,'support_category','RRHH',2),(_tenant_id,'support_category','Operaciones',3),
    (_tenant_id,'support_category','Instalaciones',4),(_tenant_id,'support_category','Otro',5);
end; $function$;
