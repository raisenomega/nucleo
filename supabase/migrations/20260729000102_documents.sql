-- 20260729000102_documents.sql
-- MÓDULO DOCUMENTOS Y CONTRATOS: repositorio de contratos/licencias/permisos/pólizas con vencimientos.
-- RLS via can_access_module('documents',*) (ceo/coo por catch-all; operaciones/servicio sin acceso).
-- get_expiring_documents: alerta de documentos que vencen en los próximos N días.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  title text not null,
  doc_category text not null check (doc_category in (
    'contract','agreement','license','permit','insurance','policy','manual','certificate','legal','other')),
  description text,
  file_url text not null, file_name text not null,
  parties text[], effective_date date, expiration_date date,
  status text not null default 'active' check (status in ('draft','active','expired','cancelled')),
  reminder_days int not null default 30, tags text[],
  uploaded_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_docs_expiration on public.documents(tenant_id, expiration_date);

alter table public.documents enable row level security;
create policy docs_sel on public.documents for select to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('documents','view'));
create policy docs_ins on public.documents for insert to authenticated
  with check (tenant_id = public.current_tenant() and public.can_access_module('documents','create'));
create policy docs_upd on public.documents for update to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('documents','edit'));
create policy docs_del on public.documents for delete to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('documents','delete'));

-- Bucket privado dedicado (patrón employee-docs): la 1ª carpeta de la ruta = tenant del JWT.
insert into storage.buckets (id, name, public) values ('tenant-documents', 'tenant-documents', false)
  on conflict (id) do nothing;
create policy tenant_documents_tenant on storage.objects
  for all to authenticated
  using ( bucket_id = 'tenant-documents' and (storage.foldername(name))[1] = public.current_tenant()::text )
  with check ( bucket_id = 'tenant-documents' and (storage.foldername(name))[1] = public.current_tenant()::text );

-- Documentos que vencen en los próximos days_ahead días (status active). Guard H3 (documents.view).
create or replace function public.get_expiring_documents(days_ahead int default 30)
returns jsonb language sql stable security definer set search_path = public as $$
  with g as (select case when public.can_access_module('documents','view') then public.current_tenant() else null end as tid)
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'title', title, 'category', doc_category, 'expirationDate', expiration_date,
    'daysLeft', (expiration_date - current_date)
  ) order by expiration_date), '[]'::jsonb)
  from public.documents
  where tenant_id = (select tid from g) and status = 'active'
    and expiration_date is not null and expiration_date between current_date and current_date + days_ahead;
$$;
grant execute on function public.get_expiring_documents(int) to authenticated;
