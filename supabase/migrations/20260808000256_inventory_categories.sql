-- 20260808000256 · Inventory Gap Fix #2 — categorías de ítem
-- Sigue el patrón maduro de NÚCLEO (tabla categories + kind + FK). Aditiva, no destructiva.
-- (1) amplía categories.kind con 'inventory_category'
-- (2) siembra 8 categorías para Zafacones Ramos (idempotente)
-- (3) FK inventory_items.category_id → categories(id) — nullable; los 36 ítems quedan sin clasificar hasta que Roy los ordene
-- (4) extiende _seed_trial_tenant para que los tenants nuevos nazcan con categorías de inventario

-- (1) CHECK: añade 'inventory_category' preservando los 11 kinds actuales
alter table public.categories drop constraint if exists categories_kind_check;
alter table public.categories add constraint categories_kind_check check (
  kind = any (array['income','expense','extraordinary','payment_method','lead_source','service_type',
                    'channel','tax_obligation','support_category','asset_type','asset_condition','inventory_category'])
);

-- (2) seed Zafacones Ramos (tenant 61205cb9-…). ON CONFLICT por la unique (tenant_id, kind, label).
insert into public.categories (tenant_id, kind, label, sort) values
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','inventory_category','Limpieza',1),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','inventory_category','Bolsas y Contenedores',2),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','inventory_category','Equipos',3),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','inventory_category','Químicos',4),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','inventory_category','Repuestos',5),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','inventory_category','Seguridad',6),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','inventory_category','Oficina',7),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','inventory_category','Otro',8)
on conflict (tenant_id, kind, label) do nothing;

-- (3) FK nullable (RLS de categories ya es tenant-scoped → el embed de PostgREST respeta el tenant)
alter table public.inventory_items add column if not exists category_id uuid references public.categories(id);

-- (4) trial seeder: mismas categorías de inventario para tenants nuevos + ON CONFLICT (idempotencia)
create or replace function private._seed_trial_tenant(_tenant_id uuid)
 returns void language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
begin
  insert into public.settings (tenant_id, key, value) values
    (_tenant_id, 'order_prefix', to_jsonb('TR'::text)),
    (_tenant_id, 'retention_enabled', to_jsonb(false))
  on conflict (tenant_id, key) do nothing;
  insert into public.tenant_themes (tenant_id) values (_tenant_id) on conflict (tenant_id) do nothing;
  insert into public.tenant_landing_config (tenant_id, hero_title, hero_cta_type)
    select _tenant_id, coalesce(nullif(trim(t.display_name),''), nullif(trim(t.legal_name),''), 'Bienvenido'), 'quote'
    from public.tenants t where t.id = _tenant_id
    on conflict (tenant_id) do nothing;
  insert into public.categories (tenant_id, kind, label, sort) values
    (_tenant_id,'income','Ventas',1),(_tenant_id,'income','Servicios',2),(_tenant_id,'income','Otros ingresos',3),
    (_tenant_id,'expense','Nómina',1),(_tenant_id,'expense','Materiales',2),(_tenant_id,'expense','Renta',3),
    (_tenant_id,'payment_method','Efectivo',1),(_tenant_id,'payment_method','Transferencia',2),
    (_tenant_id,'support_category','IT',1),(_tenant_id,'support_category','RRHH',2),(_tenant_id,'support_category','Operaciones',3),
    (_tenant_id,'support_category','Instalaciones',4),(_tenant_id,'support_category','Otro',5),
    (_tenant_id,'inventory_category','Limpieza',1),(_tenant_id,'inventory_category','Equipos',2),
    (_tenant_id,'inventory_category','Químicos',3),(_tenant_id,'inventory_category','Repuestos',4),
    (_tenant_id,'inventory_category','Seguridad',5),(_tenant_id,'inventory_category','Oficina',6),
    (_tenant_id,'inventory_category','Otro',7)
  on conflict (tenant_id, kind, label) do nothing;
end; $function$;
