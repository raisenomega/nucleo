-- RRHH-0 TAREA 5: alertas de vencimiento de certificaciones → notificación in-app.
-- Marca como 'expired' las vencidas y notifica al empleado + a los CEO/superadmin del tenant.
-- Ventana [-7d, +30d] para no re-spamear certs antiguas. Idempotente: 1 notif por cert por día.
create or replace function public.check_cert_expiry_alerts()
returns void language plpgsql security definer set search_path to 'public' as $$
declare c record; _ceo uuid; _days int; _title text; _body text; _kind text; _emp text;
begin
  update public.employee_certifications set status = 'expired'
    where expiration_date is not null and expiration_date < current_date and status <> 'expired';

  for c in
    select ec.id, ec.tenant_id, ec.profile_id, ec.certification_name, ec.expiration_date, p.full_name
    from public.employee_certifications ec
    left join public.profiles p on p.id = ec.profile_id
    where ec.expiration_date is not null
      and ec.expiration_date between current_date - 7 and current_date + 30
      and not exists (select 1 from public.notifications n where n.entity_id = ec.id
        and n.kind in ('cert_expiring', 'cert_expired') and n.created_at::date = current_date)
  loop
    _days := c.expiration_date - current_date;
    _emp := coalesce(c.full_name, 'empleado');
    if _days < 0 then
      _kind := 'cert_expired'; _title := 'Certificación vencida';
      _body := c.certification_name || ' venció el ' || c.expiration_date;
    else
      _kind := 'cert_expiring'; _title := 'Certificación por vencer';
      _body := c.certification_name || ' vence en ' || _days || ' días';
    end if;
    perform public._notify_user(c.tenant_id, c.profile_id, _kind, _title, _body, 'certification', c.id);
    for _ceo in select user_id from public.user_roles
      where tenant_id = c.tenant_id and role in ('ceo', 'superadmin') loop
      perform public._notify_user(c.tenant_id, _ceo, _kind, _title || ' — ' || _emp, _body, 'certification', c.id);
    end loop;
  end loop;
end $$;

do $$ begin
  if exists (select 1 from cron.job where jobname = 'check-cert-expiry') then
    perform cron.unschedule('check-cert-expiry');
  end if;
end $$;
select cron.schedule('check-cert-expiry', '0 8 * * *', $$select public.check_cert_expiry_alerts()$$);
