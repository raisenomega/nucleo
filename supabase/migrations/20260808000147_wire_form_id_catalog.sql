-- Migración 147: wire form_id en catálogo (products/services/packages) + helper de dependencias + asocia items Zafacones.
-- ON DELETE SET NULL: si se borra un form, los items pierden la asociación pero no se rompen. Idempotente.
-- Nota: services NO tiene billing_type (premisa spec inválida) → suscripción se detecta por nombre soterrado / requires_scheduling.

alter table public.tenant_landing_products add column if not exists form_id uuid references public.tenant_order_forms(id) on delete set null;
alter table public.tenant_landing_services add column if not exists form_id uuid references public.tenant_order_forms(id) on delete set null;
alter table public.tenant_landing_packages add column if not exists form_id uuid references public.tenant_order_forms(id) on delete set null;

create index if not exists idx_products_form_id on public.tenant_landing_products(form_id) where form_id is not null;
create index if not exists idx_services_form_id on public.tenant_landing_services(form_id) where form_id is not null;
create index if not exists idx_packages_form_id on public.tenant_landing_packages(form_id) where form_id is not null;

-- Dependencias de un form (para el check antes de eliminar). Scoped al tenant del form.
create or replace function public._get_form_dependencies(_form_id uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'products', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name)) from public.tenant_landing_products where form_id = _form_id), '[]'::jsonb),
    'services', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name)) from public.tenant_landing_services where form_id = _form_id), '[]'::jsonb),
    'packages', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name)) from public.tenant_landing_packages where form_id = _form_id), '[]'::jsonb))
  where exists (select 1 from public.tenant_order_forms where id = _form_id and tenant_id = current_tenant());
$$;
grant execute on function public._get_form_dependencies(uuid) to authenticated;

-- Asocia items existentes de Zafacones (idempotente: solo los que aún no tienen form_id)
update public.tenant_landing_services set form_id = (select id from public.tenant_order_forms where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and name ilike '%soterrado%' limit 1)
  where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and form_id is null and (name ilike '%soterrado%' or requires_scheduling = true);
update public.tenant_landing_products set form_id = (select id from public.tenant_order_forms where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and is_default limit 1)
  where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and form_id is null;
update public.tenant_landing_services set form_id = (select id from public.tenant_order_forms where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and is_default limit 1)
  where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and form_id is null;
update public.tenant_landing_packages set form_id = (select id from public.tenant_order_forms where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and is_default limit 1)
  where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and form_id is null;
