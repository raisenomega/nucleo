-- 20260808000115_void_rpcs.sql
-- VOID a nivel datos: reusa el patrón soft-delete existente (deleted_at/deleted_by/deleted_reason;
-- los snapshots financieros ya excluyen deleted_at). Agrega la columna faltante + helper de rol +
-- RPCs void_income/void_expense/void_route(id, reason). VOID = soft: la fila queda visible con badge.
-- Permiso: servicio solo lo que él creó; operaciones+ cualquiera del tenant. Motivo obligatorio 3-500.

-- Columnas faltantes (income/expenses ya tienen deleted_reason).
alter table public.service_routes add column if not exists deleted_reason text;
-- route_stops: soft-delete para la cascada de void_route (no tenían columnas de borrado).
alter table public.route_stops add column if not exists deleted_at timestamptz;
alter table public.route_stops add column if not exists deleted_by uuid;

-- Tier "operaciones o superior": ve/actúa sobre todo el tenant; servicio queda acotado a lo suyo.
create or replace function public.is_operaciones_or_above()
returns boolean language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb->>'user_role','')
    in ('superadmin','ceo','coo','operaciones')
$$;

-- Valida el motivo del VOID y devuelve el texto recortado (raise si inválido).
create or replace function public._void_reason(p_reason text)
returns text language plpgsql immutable as $$
declare _r text := btrim(coalesce(p_reason, ''));
begin
  if length(_r) < 3 or length(_r) > 500 then
    raise exception 'motivo del VOID requerido (3 a 500 caracteres)';
  end if;
  return _r;
end; $$;

create or replace function public.void_income(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare _cid uuid := gen_random_uuid(); _r text; _n int;
begin
  _r := public._void_reason(p_reason);
  update public.income set deleted_at = now(), deleted_by = auth.uid(), deleted_reason = _r
    where id = p_id and tenant_id = current_tenant() and deleted_at is null
      and (public.is_operaciones_or_above() or created_by = auth.uid());
  get diagnostics _n = row_count;
  if _n = 0 then
    raise warning 'void_income [%] rechazado: id=% uid=% tenant=%', _cid, p_id, auth.uid(), current_tenant();
    raise exception 'VOID no autorizado, o el registro no existe / ya está anulado';
  end if;
exception when others then
  raise warning 'void_income [%] EXCEPTION: sqlstate=% msg=% id=%', _cid, sqlstate, sqlerrm, p_id;
  raise;
end; $$;

create or replace function public.void_expense(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare _cid uuid := gen_random_uuid(); _r text; _n int;
begin
  _r := public._void_reason(p_reason);
  update public.expenses set deleted_at = now(), deleted_by = auth.uid(), deleted_reason = _r
    where id = p_id and tenant_id = current_tenant() and deleted_at is null
      and (public.is_operaciones_or_above() or created_by = auth.uid());
  get diagnostics _n = row_count;
  if _n = 0 then
    raise warning 'void_expense [%] rechazado: id=% uid=% tenant=%', _cid, p_id, auth.uid(), current_tenant();
    raise exception 'VOID no autorizado, o el registro no existe / ya está anulado';
  end if;
exception when others then
  raise warning 'void_expense [%] EXCEPTION: sqlstate=% msg=% id=%', _cid, sqlstate, sqlerrm, p_id;
  raise;
end; $$;

create or replace function public.void_route(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare _cid uuid := gen_random_uuid(); _r text; _n int;
begin
  _r := public._void_reason(p_reason);
  update public.service_routes set deleted_at = now(), deleted_by = auth.uid(), deleted_reason = _r
    where id = p_id and tenant_id = current_tenant() and deleted_at is null
      and (public.is_operaciones_or_above() or created_by = auth.uid());
  get diagnostics _n = row_count;
  if _n = 0 then
    raise warning 'void_route [%] rechazado: id=% uid=% tenant=%', _cid, p_id, auth.uid(), current_tenant();
    raise exception 'VOID no autorizado, o el registro no existe / ya está anulado';
  end if;
  -- cascada: los stops no tienen valor sin su ruta padre.
  update public.route_stops set deleted_at = now(), deleted_by = auth.uid()
    where route_id = p_id and tenant_id = current_tenant() and deleted_at is null;
exception when others then
  raise warning 'void_route [%] EXCEPTION: sqlstate=% msg=% id=%', _cid, sqlstate, sqlerrm, p_id;
  raise;
end; $$;

grant execute on function public.void_income(uuid, text)  to authenticated;
grant execute on function public.void_expense(uuid, text) to authenticated;
grant execute on function public.void_route(uuid, text)   to authenticated;
