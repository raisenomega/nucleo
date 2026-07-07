-- 20260724000090_set_updated_at.sql
-- PUENTE DE AUTO-CONTABILIDAD (5/6): set_updated_at genérico en cada UPDATE.
-- Aplicado SOLO a las tablas que REALMENTE tienen columna updated_at (verificado en information_schema):
-- extraordinary_payments/payroll/bank_accounts/recurring_expenses NO la tienen (se omiten); en cambio
-- route_stops/service_routes/bank_reconciliation/profiles SÍ (se incluyen).

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  NEW.updated_at = now();
  return NEW;
end $$;

do $$
declare _t text;
begin
  foreach _t in array array[
    'income','expenses','leads','inventory_items','marketing_budgets','marketing_expenses',
    'bank_balance_records','bank_reconciliation','employee_details','profiles','route_stops','service_routes'
  ] loop
    execute format('drop trigger if exists trg_updated_at on public.%I', _t);
    execute format('create trigger trg_updated_at before update on public.%I for each row execute function public.set_updated_at()', _t);
  end loop;
end $$;
