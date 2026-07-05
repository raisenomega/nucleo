-- 20260705000021_extraordinary_write_rls.sql
-- Slice #6 Extraordinarios: evidencia + RLS de escritura + defaults desde el JWT.
-- Nota: la tabla exige justification NOT NULL con CHECK char_length(btrim) >= 20.
-- Storage: el bucket "evidence" ya es tenant-scoped por ruta, sirve sin cambios.

alter table public.extraordinary_payments add column evidence_urls jsonb not null default '[]'::jsonb;
alter table public.extraordinary_payments alter column tenant_id set default public.current_tenant();
alter table public.extraordinary_payments alter column created_by set default auth.uid();

create policy extraordinary_insert_authenticated on public.extraordinary_payments
  for insert to authenticated with check ( tenant_id = public.current_tenant() );
create policy extraordinary_update_own on public.extraordinary_payments
  for update to authenticated using ( tenant_id = public.current_tenant() );
create policy extraordinary_delete_own on public.extraordinary_payments
  for delete to authenticated using ( tenant_id = public.current_tenant() );
