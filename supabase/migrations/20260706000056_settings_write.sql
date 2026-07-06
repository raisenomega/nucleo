-- 20260706000056_settings_write.sql
-- Admin (TAB Configuración): escritura de settings (retention_pct, order_prefix, fiscal_country...).
-- Opción B: RLS exige tenant + is_ceo_or_above(); el frontend además gatea el tab a ceo.

alter table public.settings alter column tenant_id set default public.current_tenant();
create policy settings_tenant_insert on public.settings
  for insert to authenticated with check ( tenant_id = public.current_tenant() and public.is_ceo_or_above() );
create policy settings_tenant_update on public.settings
  for update to authenticated using ( tenant_id = public.current_tenant() and public.is_ceo_or_above() );
