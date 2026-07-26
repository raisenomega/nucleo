-- GPS-3 A2 · Alertas de mantenimiento. Hallazgo: los campos alert_days_before/alert_km_before existían
-- pero solo se leían por pull (get_maintenance_status); nada disparaba notificaciones. Se añade un chequeo
-- diario que crea una notificación in-app al CEO por cada plan próximo/vencido (idempotente: 1 por plan por día).
create or replace function public.check_maintenance_alerts()
 returns integer language plpgsql security definer set search_path to 'public' as $$
declare _p record; _uid uuid; _n int := 0;
begin
  for _p in
    select mp.id, mp.tenant_id, mp.asset_id, mp.name, a.name as asset_name,
      (mp.recurrence_type='time' and mp.last_done_date is not null
        and (mp.last_done_date + mp.interval_days - coalesce(mp.alert_days_before,0)) <= current_date) as time_due,
      (mp.recurrence_type='meter' and mp.last_done_odometer is not null
        and (select c.odometer_reading from asset_custody_log c where c.asset_id=mp.asset_id and c.odometer_reading is not null order by c.custody_at desc limit 1)
             - mp.last_done_odometer >= (mp.interval_km - coalesce(mp.alert_km_before,0))) as meter_due
    from asset_maintenance_plans mp join tenant_assets a on a.id = mp.asset_id
    where mp.is_active = true
  loop
    if not (coalesce(_p.time_due,false) or coalesce(_p.meter_due,false)) then continue; end if;
    if exists (select 1 from notifications where entity_id=_p.id and kind='maintenance_due' and created_at::date=current_date) then continue; end if;
    select ur.user_id into _uid from user_roles ur where ur.tenant_id=_p.tenant_id and ur.role in ('ceo','superadmin') order by ur.role limit 1;
    if _uid is null then continue; end if;
    perform public._notify_user(_p.tenant_id, _uid, 'maintenance_due', _p.asset_name||' — '||_p.name,
      'Mantenimiento próximo o vencido', 'asset', _p.asset_id);
    _n := _n + 1;
  end loop;
  return _n;
end $$;

-- Cron diario (13:00 UTC ≈ 9am AST). Guardado para re-aplicación idempotente.
do $$ begin perform cron.unschedule('check-maintenance-alerts'); exception when others then null; end $$;
select cron.schedule('check-maintenance-alerts', '0 13 * * *', 'select public.check_maintenance_alerts()');
