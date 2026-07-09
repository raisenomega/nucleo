-- 20260808000119_consolidate_routes_by_day.sql
-- Consolida rutas duplicadas (tenant+route_date+assigned_to) en 1 (primera creada). Genérico.
-- Abort al primer error (todo o nada). LOCK contra mutaciones concurrentes. Unique index al final.

lock table public.service_routes in share row exclusive mode;  -- bloquea INSERT/UPDATE/DELETE concurrente; SELECT permitido

do $$
declare _g record; _surv uuid; _cid uuid := gen_random_uuid(); _processed int := 0;
begin
  raise notice 'consolidate_routes [%] START', _cid;
  for _g in
    select tenant_id, route_date, assigned_to
    from public.service_routes where deleted_at is null
    group by tenant_id, route_date, assigned_to having count(*) > 1
  loop
    begin
      select id into _surv from public.service_routes
        where tenant_id=_g.tenant_id and route_date=_g.route_date and assigned_to=_g.assigned_to and deleted_at is null
        order by created_at asc limit 1;
      update public.service_routes s set notes = (
        select string_agg(nullif(btrim(x.notes),''), E'\n---\n' order by x.created_at)
        from public.service_routes x
        where x.tenant_id=_g.tenant_id and x.route_date=_g.route_date and x.assigned_to=_g.assigned_to and x.deleted_at is null
      ) where s.id = _surv;
      update public.route_stops set route_id = _surv
        where route_id in (select id from public.service_routes
          where tenant_id=_g.tenant_id and route_date=_g.route_date and assigned_to=_g.assigned_to
            and deleted_at is null and id <> _surv);
      with ordered as (
        select id, row_number() over (order by stop_order, scheduled_time, created_at) as rn
        from public.route_stops where route_id=_surv and deleted_at is null)
      update public.route_stops rs set stop_order = ordered.rn from ordered where rs.id = ordered.id;
      delete from public.service_routes
        where tenant_id=_g.tenant_id and route_date=_g.route_date and assigned_to=_g.assigned_to
          and deleted_at is null and id <> _surv;
      _processed := _processed + 1;
    exception when others then
      raise warning 'consolidate_routes [%] combo FAILED: tenant=% date=% assigned_to=% sqlstate=% msg=%',
        _cid, _g.tenant_id, _g.route_date, _g.assigned_to, sqlstate, sqlerrm;
      raise;  -- re-propaga: rollback total (todo o nada)
    end;
  end loop;
  raise notice 'consolidate_routes [%] DONE: % combos consolidados', _cid, _processed;
end $$;

create unique index if not exists service_routes_one_per_day
  on public.service_routes (tenant_id, route_date, assigned_to) where deleted_at is null;
