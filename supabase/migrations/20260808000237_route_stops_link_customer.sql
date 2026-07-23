-- 237 · Ola 2.4a · Enlazar route_stops al maestro de clientes (por TELÉFONO — no hay email).
--
-- Último punto de contacto sin enlazar. route_stops NO tiene email → se matchea por phone normalizado a dígitos.
-- DECISIÓN: el resolver SOLO enlaza a clientes que YA existen; NUNCA crea perfiles (a diferencia del de email de
-- 2.1d) — los clientes de ruta se solapan poco con los de venta web (solo ~4/35), auto-crear inundaría el maestro
-- con perfiles de baja calidad. Enlace-existente por trigger + selector manual hacia adelante. 100% aditivo:
-- customer_id nullable; el flujo móvil (complete_route_stop/pagos/evidencia) y el AR de rutas NO se tocan.

alter table public.route_stops
  add column if not exists customer_id uuid references public.customer_profiles(id) on delete set null;
create index if not exists idx_route_stops_customer on public.route_stops (customer_id);

-- Resolver por teléfono normalizado. SOLO enlaza (devuelve NULL si no existe), nunca crea. Mínimo 7 dígitos.
create or replace function public._resolve_customer_by_phone(_tenant uuid, _phone text)
returns uuid language plpgsql security definer set search_path = public as $function$
declare _digits text := regexp_replace(coalesce(_phone,''), '\D', '', 'g'); _id uuid;
begin
  if length(_digits) < 7 then return null; end if;
  select id into _id from public.customer_profiles
    where tenant_id = _tenant and regexp_replace(coalesce(phone,''), '\D', '', 'g') = _digits limit 1;
  return _id;
end $function$;
revoke execute on function public._resolve_customer_by_phone(uuid, text) from public, anon, authenticated;

-- Trigger BEFORE INSERT: auto-enlaza por teléfono si la parada no trae customer_id explícito (del selector).
create or replace function public._route_stop_autolink_customer()
returns trigger language plpgsql security definer set search_path = public as $function$
begin
  if new.customer_id is null and new.phone is not null then
    new.customer_id := public._resolve_customer_by_phone(new.tenant_id, new.phone);
  end if;
  return new;
end $function$;
revoke execute on function public._route_stop_autolink_customer() from public, anon, authenticated;
drop trigger if exists trg_route_stop_autolink on public.route_stops;
create trigger trg_route_stop_autolink before insert on public.route_stops
  for each row execute function public._route_stop_autolink_customer();

-- upsert_route: persiste customer_id del jsonb de la parada (def viva + una columna). NO toca append/conflict.
create or replace function public.upsert_route(p_date date, p_assigned_to uuid, p_notes text, p_stops jsonb)
returns uuid language plpgsql set search_path to 'public', 'pg_temp' as $function$
declare _cid uuid := gen_random_uuid(); _rid uuid; _base int;
begin
  insert into public.service_routes (route_date, assigned_to, notes)
    values (p_date, p_assigned_to, nullif(btrim(p_notes), ''))
    on conflict (tenant_id, route_date, assigned_to) where deleted_at is null do nothing
    returning id into _rid;
  if _rid is null then
    select id into _rid from public.service_routes
      where tenant_id = current_tenant() and route_date = p_date and assigned_to = p_assigned_to and deleted_at is null;
    if _rid is null then
      raise warning 'upsert_route [%] insert-no-conflict + select-null: date=% assigned_to=% tenant=%', _cid, p_date, p_assigned_to, current_tenant();
      raise exception 'upsert_route: no autorizado o ruta inaccesible';
    end if;
    if nullif(btrim(p_notes), '') is not null then
      update public.service_routes set notes = coalesce(notes || E'\n---\n', '') || btrim(p_notes) where id = _rid;
    end if;
  end if;
  select coalesce(max(stop_order), 0) into _base from public.route_stops where route_id = _rid and deleted_at is null;
  insert into public.route_stops (route_id, stop_order, client_name, address, city, service_type, scheduled_time, estimated_amount, notes, phone, customer_id)
    select _rid, _base + ord::int, e->>'client_name', e->>'address', nullif(e->>'city',''), e->>'service_type',
           (e->>'scheduled_time')::time, (e->>'estimated_amount')::numeric, nullif(e->>'notes',''), nullif(e->>'phone',''), nullif(e->>'customer_id','')::uuid
    from jsonb_array_elements(coalesce(p_stops, '[]'::jsonb)) with ordinality as t(e, ord);
  return _rid;
exception when others then
  raise warning 'upsert_route [%] EXCEPTION: sqlstate=% msg=% date=% assigned_to=%', _cid, sqlstate, sqlerrm, p_date, p_assigned_to;
  raise;
end; $function$;

-- Backfill: enlaza las paradas cuyo teléfono ya está en el maestro (mismo tenant, ≥7 dígitos).
update public.route_stops rs set customer_id = cp.id
from public.customer_profiles cp
where rs.customer_id is null and rs.tenant_id = cp.tenant_id
  and length(regexp_replace(coalesce(rs.phone,''), '\D', '', 'g')) >= 7
  and regexp_replace(coalesce(rs.phone,''), '\D', '', 'g') = regexp_replace(coalesce(cp.phone,''), '\D', '', 'g');
