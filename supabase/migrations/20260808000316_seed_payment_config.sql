-- ============================================================================
-- STRIPE-1 · cada tenant nace con su fila de tenant_payment_config (defaults).
--   Sin esto no hay crash (get_stripe_config devuelve {configured:false} y
--   save_stripe_credentials hace on-conflict-do-update), pero pre-crear la fila
--   deja la invariante "todo tenant tiene config" → escala a N tenants sin código extra.
--   Sigue el patrón de trg_seed_leave_types / trg_seed_onboarding (AFTER INSERT en tenants).
-- ============================================================================
create or replace function public._seed_payment_config()
 returns trigger language plpgsql security definer set search_path to 'public'
as $fn$
begin
  insert into public.tenant_payment_config(tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  return new;
end $fn$;
revoke execute on function public._seed_payment_config() from public, anon;

drop trigger if exists trg_seed_payment_config on public.tenants;
create trigger trg_seed_payment_config after insert on public.tenants
  for each row execute function public._seed_payment_config();

-- Backfill de los tenants existentes.
insert into public.tenant_payment_config(tenant_id)
  select t.id from public.tenants t
  where not exists (select 1 from public.tenant_payment_config c where c.tenant_id = t.id)
on conflict (tenant_id) do nothing;
