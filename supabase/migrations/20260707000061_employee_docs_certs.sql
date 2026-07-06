-- 20260707000061_employee_docs_certs.sql
-- Expediente: certificaciones + documentos + bucket privado employee-docs. RLS ceo+ / tenant-scoped.

create table public.employee_certifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  certification_name text not null, certification_number text,
  issued_date date, expiration_date date,
  status text default 'active' check (status in ('active','expired','pending')),
  document_url text, created_at timestamptz not null default now()
);
alter table public.employee_certifications enable row level security;
create policy certs_ceo on public.employee_certifications
  for all to authenticated
  using ( tenant_id = public.current_tenant() and public.is_ceo_or_above() )
  with check ( tenant_id = public.current_tenant() and public.is_ceo_or_above() );

create table public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  doc_type text not null check (doc_type in ('i9','w4','contract','medical_cert','background_check',
    'drug_test','id_photo','ss_card','education','certification','reference','nda','other')),
  file_name text not null, file_url text not null, document_date date, notes text,
  uploaded_by uuid default auth.uid(), created_at timestamptz not null default now()
);
alter table public.employee_documents enable row level security;
create policy docs_ceo on public.employee_documents
  for all to authenticated
  using ( tenant_id = public.current_tenant() and public.is_ceo_or_above() )
  with check ( tenant_id = public.current_tenant() and public.is_ceo_or_above() );

-- Bucket privado (mismo patrón que 'evidence'): la 1ª carpeta de la ruta = tenant del JWT.
insert into storage.buckets (id, name, public) values ('employee-docs', 'employee-docs', false)
  on conflict (id) do nothing;
create policy employee_docs_tenant on storage.objects
  for all to authenticated
  using ( bucket_id = 'employee-docs' and (storage.foldername(name))[1] = public.current_tenant()::text )
  with check ( bucket_id = 'employee-docs' and (storage.foldername(name))[1] = public.current_tenant()::text );
