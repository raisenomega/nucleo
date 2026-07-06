-- 20260706000055_identity_write.sql
-- Admin (BC identity): escritura de profiles/user_roles/allowed_emails.
-- Opción B (defensa en profundidad): RLS exige tenant + is_ceo_or_above(); el frontend además oculta la UI.

-- profiles: UPDATE (aprobar/rechazar/cambiar estado) — solo ceo+
create policy profiles_tenant_update on public.profiles
  for update to authenticated
  using ( tenant_id = public.current_tenant() and public.is_ceo_or_above() )
  with check ( tenant_id = public.current_tenant() and public.is_ceo_or_above() );

-- user_roles: asignar/cambiar/quitar rol — solo ceo+
alter table public.user_roles alter column tenant_id set default public.current_tenant();
create policy user_roles_insert on public.user_roles
  for insert to authenticated with check ( tenant_id = public.current_tenant() and public.is_ceo_or_above() );
create policy user_roles_update on public.user_roles
  for update to authenticated using ( tenant_id = public.current_tenant() and public.is_ceo_or_above() );
create policy user_roles_delete on public.user_roles
  for delete to authenticated using ( tenant_id = public.current_tenant() and public.is_ceo_or_above() );

-- allowed_emails: invitar/editar/quitar autorización — solo ceo+
alter table public.allowed_emails alter column tenant_id set default public.current_tenant();
create policy allowed_emails_insert on public.allowed_emails
  for insert to authenticated with check ( tenant_id = public.current_tenant() and public.is_ceo_or_above() );
create policy allowed_emails_update on public.allowed_emails
  for update to authenticated using ( tenant_id = public.current_tenant() and public.is_ceo_or_above() );
create policy allowed_emails_delete on public.allowed_emails
  for delete to authenticated using ( tenant_id = public.current_tenant() and public.is_ceo_or_above() );
