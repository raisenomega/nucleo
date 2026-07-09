-- 20260808000120_upsert_route.sql
-- Append-on-create atómico (A2+B1+C1). SECURITY INVOKER: la RLS 117 + unique index (119) son el guard.
-- Si ya existe ruta del día+empleado, agrega stops a la existente (concat notes si hay). Cero race.
create or replace function public.upsert_route(p_date date, p_assigned_to uuid, p_notes text, p_stops jsonb)
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare _cid uuid := gen_random_uuid(); _rid uuid; _base int;
begin
  insert into public.service_routes (route_date, assigned_to, notes)
    values (p_date, p_assigned_to, nullif(btrim(p_notes), ''))
    on conflict (tenant_id, route_date, assigned_to) where deleted_at is null do nothing
    returning id into _rid;
  if _rid is null then                                  -- ya existía (C1 append transparente)
    select id into _rid from public.service_routes
      where tenant_id = current_tenant() and route_date = p_date and assigned_to = p_assigned_to and deleted_at is null;
    if _rid is null then
      raise warning 'upsert_route [%] insert-no-conflict + select-null: date=% assigned_to=% tenant=%',
        _cid, p_date, p_assigned_to, current_tenant();
      raise exception 'upsert_route: no autorizado o ruta inaccesible';
    end if;
    if nullif(btrim(p_notes), '') is not null then      -- concat notes nuevas
      update public.service_routes set notes = coalesce(notes || E'\n---\n', '') || btrim(p_notes) where id = _rid;
    end if;
  end if;
  select coalesce(max(stop_order), 0) into _base from public.route_stops where route_id = _rid and deleted_at is null;
  insert into public.route_stops (route_id, stop_order, client_name, address, city, service_type, scheduled_time, estimated_amount, notes, phone)
    select _rid, _base + ord::int, e->>'client_name', e->>'address', nullif(e->>'city',''), e->>'service_type',
           (e->>'scheduled_time')::time, (e->>'estimated_amount')::numeric, nullif(e->>'notes',''), nullif(e->>'phone','')
    from jsonb_array_elements(coalesce(p_stops, '[]'::jsonb)) with ordinality as t(e, ord);
  return _rid;
exception when others then
  raise warning 'upsert_route [%] EXCEPTION: sqlstate=% msg=% date=% assigned_to=%', _cid, sqlstate, sqlerrm, p_date, p_assigned_to;
  raise;
end; $$;
grant execute on function public.upsert_route(date, uuid, text, jsonb) to authenticated;
