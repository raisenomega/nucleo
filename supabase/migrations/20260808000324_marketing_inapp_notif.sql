-- MARKETING-LEADS-DEUDA TAREA 1: notificación IN-APP al superadmin cuando entra un lead/reserva de plataforma.
-- Hoy los triggers de email (sesión #192/#244) mandan correo pero NO insertan en `notifications` → la campana
-- del superadmin marca 0. Aquí van triggers SEPARADOS (no tocan los de email) que insertan por cada superadmin.
-- La campana es compartida (AppLayout, todas las rutas auth incl. /web/*) y lee notifications por user_id=auth.uid().

-- Helper: inserta una notificación por cada superadmin activo (marketing es platform-level, sin tenant_id propio;
-- usamos el tenant_id del rol del superadmin porque notifications.tenant_id es NOT NULL).
create or replace function public._notify_superadmins(_kind text, _title text, _body text, _entity_type text, _entity_id uuid)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
begin
  insert into public.notifications(tenant_id, user_id, kind, title, body, entity_type, entity_id)
  select ur.tenant_id, ur.user_id, _kind, _title, left(_body, 300), _entity_type, _entity_id
  from public.user_roles ur where ur.role = 'superadmin';
end $function$;
revoke execute on function public._notify_superadmins(text, text, text, text, uuid) from public, anon;

create or replace function public._notify_marketing_lead_inapp()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  perform public._notify_superadmins('marketing_lead', 'Nuevo lead comercial',
    NEW.customer_name || coalesce(' · ' || NEW.lead_type, '') || coalesce(' · ' || NEW.customer_email, ''),
    'marketing_lead', NEW.id);
  return NEW;
exception when others then raise warning 'lead inapp notify fail lead=%: %', NEW.id, sqlerrm; return NEW;
end $function$;
create trigger trg_notify_marketing_lead_inapp after insert on public.marketing_leads
  for each row execute function public._notify_marketing_lead_inapp();

create or replace function public._notify_marketing_reservation_inapp()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  perform public._notify_superadmins('marketing_reservation', 'Nueva reserva de demo',
    NEW.customer_name || ' · ' || to_char(NEW.reservation_date, 'YYYY-MM-DD') || ' ' || to_char(NEW.reservation_time, 'HH24:MI'),
    'marketing_reservation', NEW.id);
  return NEW;
exception when others then raise warning 'res inapp notify fail res=%: %', NEW.id, sqlerrm; return NEW;
end $function$;
create trigger trg_notify_marketing_reservation_inapp after insert on public.marketing_reservations
  for each row execute function public._notify_marketing_reservation_inapp();
