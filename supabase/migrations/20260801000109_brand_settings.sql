-- 20260801000109_brand_settings.sql
-- PLANTILLAS/BRANDING: bucket brand (logo por tenant) + tenants.display_name +
-- RPC para editar identidad (tenants solo tiene policy SELECT; el update va con guard ceo).
-- Los demás campos (dirección, teléfono, colores, etc.) van en settings (tabla existente).

insert into storage.buckets (id, name, public) values ('brand', 'brand', false)
  on conflict (id) do nothing;

create policy brand_tenant on storage.objects
  for all to authenticated
  using ( bucket_id = 'brand' and (storage.foldername(name))[1] = public.current_tenant()::text )
  with check ( bucket_id = 'brand' and (storage.foldername(name))[1] = public.current_tenant()::text );

alter table public.tenants add column if not exists display_name text;

-- Identidad editable solo por ceo (settings.edit = gate de dueño, igual que el tab General).
create or replace function public.update_tenant_identity(p_legal_name text, p_display_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_access_module('settings','edit') then raise exception 'No autorizado'; end if;
  if p_legal_name is null or length(trim(p_legal_name)) = 0 then raise exception 'legal_name requerido'; end if;
  update tenants set legal_name = trim(p_legal_name), display_name = nullif(trim(coalesce(p_display_name,'')), '')
    where id = current_tenant();
end $$;
grant execute on function public.update_tenant_identity(text, text) to authenticated;
