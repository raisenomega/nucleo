-- 20260731000108_pdf_service.sql
-- GOTENBERG PDF SERVICE: bucket tenant-pdfs (privado, RLS por tenant) + caché pdf_url en invoices/quotes.
-- El pdf-api (service role) escribe; usuarios solo leen su carpeta de tenant vía signed URL.

insert into storage.buckets (id, name, public) values ('tenant-pdfs', 'tenant-pdfs', false)
  on conflict (id) do nothing;

create policy tenant_pdfs_tenant on storage.objects
  for all to authenticated
  using ( bucket_id = 'tenant-pdfs' and (storage.foldername(name))[1] = public.current_tenant()::text )
  with check ( bucket_id = 'tenant-pdfs' and (storage.foldername(name))[1] = public.current_tenant()::text );

-- Caché: regenerar solo si updated_at > pdf_generated_at (lo compara el pdf-api).
alter table public.invoices add column if not exists pdf_url text;
alter table public.invoices add column if not exists pdf_generated_at timestamptz;
alter table public.quotes   add column if not exists pdf_url text;
alter table public.quotes   add column if not exists pdf_generated_at timestamptz;
