-- 20260705000024_leads_write_rls.sql
-- Slice #9 Leads (BC crm): evidencia + RLS de escritura + defaults desde el JWT.
-- attended_by es NOT NULL sin default y el form no lo pide → default auth.uid().
-- created_by ya default auth.uid(). Storage: bucket "evidence" ya tenant-scoped por ruta.

alter table public.leads add column evidence_urls jsonb not null default '[]'::jsonb;
alter table public.leads alter column tenant_id set default public.current_tenant();
alter table public.leads alter column attended_by set default auth.uid();

create policy leads_insert on public.leads
  for insert to authenticated with check ( tenant_id = public.current_tenant() );
create policy leads_update on public.leads
  for update to authenticated using ( tenant_id = public.current_tenant() );
create policy leads_delete on public.leads
  for delete to authenticated using ( tenant_id = public.current_tenant() );
