-- 20260808000112_tenant_themes.sql
-- Consolida el branding runtime en public.tenant_themes (una fila por tenant, columnas tipadas).
-- Backfill desde settings.primary_color/accent_color → tabla · borra esas claves de settings ·
-- siembra fila NULL en _seed_trial_tenant (invariante) · convierte el bucket brand a público.
-- NULL en una columna = "hereda el default de plataforma" (el loader no sobrescribe con NULL).

create table if not exists public.tenant_themes (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  primary_color text, secondary_color text, accent_color text,
  sidebar_bg text, sidebar_text text, sidebar_hover text,
  danger_color text, success_color text, warning_color text,
  default_mode text check (default_mode in ('light','dark')),
  logo_url text, favicon_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenant_themes enable row level security;
create policy tt_select on public.tenant_themes for select to authenticated using (tenant_id = public.current_tenant());
create policy tt_update on public.tenant_themes for update to authenticated
  using (tenant_id = public.current_tenant()) with check (tenant_id = public.current_tenant());
create policy tt_delete on public.tenant_themes for delete to authenticated using (tenant_id = public.current_tenant());

-- NOTA INTENCIONAL: tenant_themes NO tiene policy INSERT.
-- La única forma de crear una fila es vía private._seed_trial_tenant() (SECURITY DEFINER, bypasea RLS).
-- Un tenant no debe poder insertarse una fila directa desde el cliente; siempre se crea en el signup.
-- Si en el futuro se necesita INSERT desde otro path, agregar policy tt_insert AQUÍ y documentar por qué.

drop trigger if exists trg_updated_at on public.tenant_themes;
create trigger trg_updated_at before update on public.tenant_themes for each row execute function public.set_updated_at();

-- Backfill: UNA fila por CADA tenant. Un solo scan de settings (jsonb string → text) si existe; NULL si no.
insert into public.tenant_themes (tenant_id, primary_color, accent_color)
select
  t.id,
  max(case when s.key = 'primary_color' then s.value #>> '{}' end) as primary_color,
  max(case when s.key = 'accent_color'  then s.value #>> '{}' end) as accent_color
from public.tenants t
left join public.settings s on s.tenant_id = t.id and s.key in ('primary_color','accent_color')
group by t.id
on conflict (tenant_id) do nothing;

-- _seed_trial_tenant: añade la fila de tema con NULLs (herencia). Resto del seed idéntico.
create or replace function private._seed_trial_tenant(_tenant_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.settings (tenant_id, key, value) values
    (_tenant_id, 'order_prefix', to_jsonb('TR'::text)),
    (_tenant_id, 'retention_enabled', to_jsonb(false))
  on conflict (tenant_id, key) do nothing;
  insert into public.tenant_themes (tenant_id) values (_tenant_id) on conflict (tenant_id) do nothing;  -- fila NULL = hereda
  insert into public.categories (tenant_id, kind, label, sort) values
    (_tenant_id,'income','Ventas',1),(_tenant_id,'income','Servicios',2),(_tenant_id,'income','Otros ingresos',3),
    (_tenant_id,'expense','Nómina',1),(_tenant_id,'expense','Insumos',2),(_tenant_id,'expense','Renta',3),
    (_tenant_id,'payment_method','Efectivo',1),(_tenant_id,'payment_method','Transferencia',2),
    (_tenant_id,'support_category','IT',1),(_tenant_id,'support_category','RRHH',2),(_tenant_id,'support_category','Operaciones',3),
    (_tenant_id,'support_category','Instalaciones',4),(_tenant_id,'support_category','Otro',5);
end; $$;

-- Borra las claves viejas de settings (después del backfill). Fuente única = tenant_themes.
delete from public.settings where key in ('primary_color', 'accent_color');

-- Bucket brand → público: read a todos, write/update/delete tenant-scoped por path {tenant}/…
update storage.buckets set public = true where id = 'brand';
drop policy if exists brand_tenant on storage.objects;
create policy brand_read_public on storage.objects for select to public using (bucket_id = 'brand');
create policy brand_write_tenant on storage.objects for insert to authenticated
  with check (bucket_id = 'brand' and (storage.foldername(name))[1] = public.current_tenant()::text);
create policy brand_update_tenant on storage.objects for update to authenticated
  using (bucket_id = 'brand' and (storage.foldername(name))[1] = public.current_tenant()::text);
create policy brand_delete_tenant on storage.objects for delete to authenticated
  using (bucket_id = 'brand' and (storage.foldername(name))[1] = public.current_tenant()::text);
