-- 219 · Ola 1.2b · Bloqueo de período cerrado. Cierra el hueco de 1.2a: un mes cerrado ahora IMPIDE
-- crear/editar/borrar transacciones con fecha en ese mes.
--
-- Cubre INSERT + UPDATE + DELETE en las 4 transaccionales. El **void es un UPDATE de deleted_at**, así que
-- UPDATE debe estar cubierto o se podría anular una transacción de un mes ya congelado. En UPDATE se valida
-- la fecha VIEJA (bloquea tocar algo ya en mes cerrado) Y la NUEVA (bloquea mover una fila HACIA un mes
-- cerrado). El mensaje va directo en la excepción (no un código cifrado) para que cualquier ruta de error del
-- cliente lo muestre tal cual.
--
-- Decisión (riesgo #1): la automatización retroactiva se BLOQUEA. Si una entrada de inventario con
-- movement_date en mes cerrado dispara auto_expense_on_inventory_entry → el INSERT en expenses lo frena este
-- trigger → la transacción entera (entrada + gasto) se revierte. El CEO reabre, ajusta, re-cierra.

create or replace function public._is_month_closed(p_tenant uuid, p_date date)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.month_closures
    where tenant_id = p_tenant
      and period_year = extract(year from p_date)::int
      and period_month = extract(month from p_date)::int);
$$;

create or replace function public.enforce_period_lock()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _col text := TG_ARGV[0];   -- nombre de la columna de fecha, pasado por CREATE TRIGGER
  _tenant uuid;
  _old date; _new date;
begin
  -- tenant y fechas de forma genérica (to_jsonb evita SQL dinámico frágil sobre OLD/NEW).
  if TG_OP = 'DELETE' then _tenant := OLD.tenant_id; else _tenant := NEW.tenant_id; end if;
  if TG_OP in ('UPDATE','DELETE') then _old := (to_jsonb(OLD)->>_col)::date; end if;
  if TG_OP in ('INSERT','UPDATE') then _new := (to_jsonb(NEW)->>_col)::date; end if;

  -- Fecha VIEJA en mes cerrado → cualquier UPDATE/DELETE sobre esa fila queda bloqueado (incluye el void).
  if _old is not null and public._is_month_closed(_tenant, _old) then
    raise exception 'El mes % está cerrado. Reábrelo desde Conciliación para modificar sus transacciones.', to_char(_old,'MM/YYYY')
      using errcode = 'P0001';
  end if;
  -- Fecha NUEVA en mes cerrado (INSERT, o UPDATE que MUEVE la fecha hacia un mes cerrado).
  if _new is not null and (_old is null or _new <> _old) and public._is_month_closed(_tenant, _new) then
    raise exception 'El mes % está cerrado. Reábrelo desde Conciliación para registrar transacciones con esa fecha.', to_char(_new,'MM/YYYY')
      using errcode = 'P0001';
  end if;

  if TG_OP = 'DELETE' then return OLD; end if;
  return NEW;
end $$;

-- Enganche en las 4 tablas. Prefijo `aa_` → corre ANTES de los BEFORE existentes (retención, justificación,
-- updated_at): fail-fast, sin trabajo desperdiciado. La columna de fecha va como argumento del trigger.
drop trigger if exists aa_enforce_period_lock on public.income;
create trigger aa_enforce_period_lock before insert or update or delete on public.income
  for each row execute function public.enforce_period_lock('income_date');

drop trigger if exists aa_enforce_period_lock on public.expenses;
create trigger aa_enforce_period_lock before insert or update or delete on public.expenses
  for each row execute function public.enforce_period_lock('expense_date');

drop trigger if exists aa_enforce_period_lock on public.extraordinary_payments;
create trigger aa_enforce_period_lock before insert or update or delete on public.extraordinary_payments
  for each row execute function public.enforce_period_lock('payment_date');

drop trigger if exists aa_enforce_period_lock on public.payroll;
create trigger aa_enforce_period_lock before insert or update or delete on public.payroll
  for each row execute function public.enforce_period_lock('pay_date');
