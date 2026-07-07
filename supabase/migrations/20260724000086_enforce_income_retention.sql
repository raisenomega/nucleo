-- 20260724000086_enforce_income_retention.sql
-- PUENTE DE AUTO-CONTABILIDAD (1/6): retención automática por ingreso.
-- MEJORA vs spec del owner: BEFORE INSERT (setea NEW.retention_amount atómicamente, sin segundo UPDATE
-- ni problema de RLS) y respeta `retention_enabled` de settings (white-label: no todo tenant retiene).
-- pct configurable por tenant (settings.retention_pct, default 20). retention_amount ya existe (NOT NULL).

create or replace function public.enforce_income_retention()
returns trigger language plpgsql security definer set search_path = public as $$
declare _enabled boolean; _pct numeric;
begin
  select coalesce((value#>>'{}')::boolean, false) into _enabled
    from public.settings where tenant_id = NEW.tenant_id and key = 'retention_enabled';
  if coalesce(_enabled, false) then
    select coalesce((value#>>'{}')::numeric, 20) into _pct
      from public.settings where tenant_id = NEW.tenant_id and key = 'retention_pct';
    NEW.retention_amount := round(NEW.amount * coalesce(_pct, 20) / 100.0, 2);
  else
    NEW.retention_amount := 0;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_income_retention on public.income;
create trigger trg_income_retention before insert on public.income
  for each row execute function public.enforce_income_retention();
