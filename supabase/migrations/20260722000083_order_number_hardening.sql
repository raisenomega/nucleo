-- 20260722000083_order_number_hardening.sql
-- ROBUSTEZ (menor): next_order_number no fijaba search_path y si el tenant no tenía fila en
-- tenant_order_counters, el UPDATE no afectaba filas y devolvía NULL en silencio -> '#'||prefix||NULL = NULL.
-- Fix: SET search_path + upsert del contador (crea la fila si falta) antes de incrementar.

create or replace function public.next_order_number(_tenant uuid)
returns text language plpgsql
set search_path = public as $$
declare _n bigint; _prefix text;
begin
  insert into public.tenant_order_counters (tenant_id, next_val)
    values (_tenant, 0)
    on conflict (tenant_id) do nothing;

  update public.tenant_order_counters set next_val = next_val + 1
    where tenant_id = _tenant returning next_val - 1 into _n;

  if _n is null then raise exception 'no se pudo generar número de orden para el tenant %', _tenant; end if;

  select value->>0 from public.settings
    where tenant_id = _tenant and key = 'order_prefix' into _prefix;
  return '#' || coalesce(_prefix,'') || _n::text;
end $$;
