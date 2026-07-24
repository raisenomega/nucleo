-- 20260808000257 · Inventory Gap Fix #3 — Unidad de Medida (UOM)
-- Tabla propia (no reuso de categories): las UOM tienen abreviatura, grupo y conversión futura → no son categorías.
-- Aditiva. FK nullable en inventory_items → los 36 ítems quedan sin UOM hasta que Roy las asigne.

create table public.units_of_measure (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  abbreviation text not null,
  uom_group text not null default 'count'
    check (uom_group in ('count','volume','weight','length','area','time','other')),
  base_unit_id uuid references public.units_of_measure(id),
  conversion_factor numeric default 1,
  is_default boolean default false,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, abbreviation)
);

alter table public.units_of_measure enable row level security;
-- RLS espejo de inventory_items: SELECT tenant-scoped; escritura gateada por el módulo inventory.
create policy uom_tenant_select on public.units_of_measure for select to authenticated
  using (tenant_id = current_tenant());
create policy uom_module_insert on public.units_of_measure for insert to authenticated
  with check (tenant_id = current_tenant() and can_access_module('inventory','create'));
create policy uom_module_update on public.units_of_measure for update to authenticated
  using (tenant_id = current_tenant() and can_access_module('inventory','edit'));
create policy uom_module_delete on public.units_of_measure for delete to authenticated
  using (tenant_id = current_tenant() and can_access_module('inventory','delete'));

create trigger trg_updated_at before update on public.units_of_measure
  for each row execute function public.set_updated_at();

alter table public.inventory_items add column if not exists unit_of_measure_id uuid references public.units_of_measure(id);

-- Seed Zafacones Ramos (tenant 61205cb9-…). ON CONFLICT por la unique (tenant_id, abbreviation).
insert into public.units_of_measure (tenant_id, name, abbreviation, uom_group, is_default) values
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','Unidad','un','count',true),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','Caja','cj','count',false),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','Par','par','count',false),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','Galón','gal','volume',false),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','Litro','lt','volume',false),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','Onza líquida','fl oz','volume',false),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','Libra','lb','weight',false),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','Onza','oz','weight',false),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','Pie','ft','length',false),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','Rollo','rollo','other',false),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','Bolsa','bolsa','other',false),
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310','Paquete','paq','count',false)
on conflict (tenant_id, abbreviation) do nothing;

-- Trial seeder: mismas UOM para tenants nuevos (reproduce el cuerpo actual + bloque UOM).
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
  insert into public.units_of_measure (tenant_id, name, abbreviation, uom_group, is_default) values
    (_tenant_id,'Unidad','un','count',true),(_tenant_id,'Caja','cj','count',false),(_tenant_id,'Par','par','count',false),
    (_tenant_id,'Galón','gal','volume',false),(_tenant_id,'Litro','lt','volume',false),(_tenant_id,'Libra','lb','weight',false),
    (_tenant_id,'Pie','ft','length',false),(_tenant_id,'Rollo','rollo','other',false),(_tenant_id,'Paquete','paq','count',false)
  on conflict (tenant_id, abbreviation) do nothing;
end; $function$;
