-- 20260705000025_lead_items_and_config.sql
-- Leads v2: dropdowns configurables (categories kinds lead_source/service_type) + tabla hija lead_items.
-- leads ya tiene address/city → solo se añade zip_code + FKs a categories. Seed a tenants existentes.

-- 1) categories: ampliar el CHECK de kind (constraint anónimo → localizar y reemplazar).
do $$
declare _c text;
begin
  select conname into _c from pg_constraint
   where conrelid = 'public.categories'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%kind%';
  if _c is not null then execute format('alter table public.categories drop constraint %I', _c); end if;
end $$;
alter table public.categories add constraint categories_kind_check
  check (kind in ('income','expense','extraordinary','payment_method','lead_source','service_type'));

-- 2) leads: zip + FKs configurables. Las columnas text legacy dejan de ser NOT NULL.
alter table public.leads add column zip_code text;
alter table public.leads add column lead_source_id uuid references public.categories(id);
alter table public.leads add column service_type_id uuid references public.categories(id);
alter table public.leads alter column lead_source drop not null;
alter table public.leads alter column service_requested drop not null;

-- 3) lead_items: tabla hija con total de línea calculado por la DB (columna generada).
create table public.lead_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  lead_id uuid not null references public.leads(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_pct numeric(5,2) not null default 0,
  discount_pct numeric(5,2) not null default 0,
  line_total numeric(14,2) generated always as
    (quantity * unit_price * (1 - discount_pct / 100) * (1 + tax_pct / 100)) stored,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.lead_items enable row level security;
create policy lead_items_select on public.lead_items
  for select to authenticated using ( tenant_id = public.current_tenant() );
create policy lead_items_insert on public.lead_items
  for insert to authenticated with check ( tenant_id = public.current_tenant() );
create policy lead_items_update on public.lead_items
  for update to authenticated using ( tenant_id = public.current_tenant() );
create policy lead_items_delete on public.lead_items
  for delete to authenticated using ( tenant_id = public.current_tenant() );

-- 4) Seed demo a tenants EXISTENTES (nuevos trials → create_trial_tenant en 00026).
insert into public.categories (tenant_id, kind, label, sort)
select t.id, 'lead_source', s.label, s.ord from public.tenants t
cross join (values ('Facebook',1),('Instagram',2),('Google',3),('WhatsApp',4),('Referido',5),('Otro',6)) s(label, ord)
on conflict (tenant_id, kind, label) do nothing;
insert into public.categories (tenant_id, kind, label, sort)
select t.id, 'service_type', s.label, s.ord from public.tenants t
cross join (values ('Instalación',1),('Mantenimiento',2),('Reparación',3),('Consultoría',4)) s(label, ord)
on conflict (tenant_id, kind, label) do nothing;
