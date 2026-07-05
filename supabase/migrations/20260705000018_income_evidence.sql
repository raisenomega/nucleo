-- 20260705000018_income_evidence.sql
-- Slice #3.1: evidencia (fotos/recibos) por ingreso.
-- Columna evidence_urls (rutas de storage) + bucket privado "evidence" + RLS tenant-scoped.

alter table public.income add column evidence_urls jsonb not null default '[]'::jsonb;

-- Bucket privado: la evidencia financiera NO es pública, se accede con signed URLs.
insert into storage.buckets (id, name, public)
  values ('evidence', 'evidence', false)
  on conflict (id) do nothing;

-- RLS en storage.objects: la primera carpeta de la ruta debe ser el tenant del JWT.
-- Ruta esperada: {tenant_id}/{uuid}/{archivo}.
create policy evidence_tenant_insert on storage.objects
  for insert to authenticated
  with check ( bucket_id = 'evidence' and (storage.foldername(name))[1] = public.current_tenant()::text );

create policy evidence_tenant_select on storage.objects
  for select to authenticated
  using ( bucket_id = 'evidence' and (storage.foldername(name))[1] = public.current_tenant()::text );

create policy evidence_tenant_delete on storage.objects
  for delete to authenticated
  using ( bucket_id = 'evidence' and (storage.foldername(name))[1] = public.current_tenant()::text );
