-- 207 · Rodaja Reservas + Disponibilidad E2E (platform-level). Sistema NATIVO de agendar demo (patrón OMEGA
-- 00091, adaptado sin backend/Stripe). Config rule-based (días+horas+intervalo) + fechas bloqueadas + reservas.
-- El visitante agenda vía RPC SECURITY DEFINER (slots disponibles + crear reserva, que reusa slots → anti doble-
-- booking). Email best-effort al Super Admin (Resend/http, patrón migr 203). RLS: config/bloqueos públicos R;
-- reservas SOLO superadmin (el visitante no lee ni inserta directo). dow: 0=Dom..6=Sáb. tz explícita (PR=AST).
create extension if not exists http with schema extensions;

create table if not exists public.marketing_availability (
  id uuid primary key default gen_random_uuid(),
  timezone text not null default 'America/Puerto_Rico',
  duration_minutes int not null default 30,
  buffer_minutes int not null default 0,
  max_per_day int not null default 0,
  available_days int[] not null default '{1,2,3,4,5}',
  hours_start time not null default '09:00', hours_end time not null default '17:00',
  title_es text not null default 'Agenda una demo', title_en text not null default 'Book a demo',
  subtitle_es text not null default 'Elige el día y la hora que mejor te convenga.', subtitle_en text not null default 'Pick the day and time that works best for you.',
  confirm_es text not null default '¡Reserva confirmada! Te enviaremos los detalles por correo.', confirm_en text not null default 'Booking confirmed! We''ll send you the details by email.',
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.marketing_reservations (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null, customer_email text not null, customer_phone text,
  reservation_date date not null, reservation_time time not null,
  duration_minutes int not null default 30,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed','no_show')),
  notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_marketing_reservations_slot on public.marketing_reservations (reservation_date, reservation_time);

drop trigger if exists set_marketing_availability_updated_at on public.marketing_availability;
create trigger set_marketing_availability_updated_at before update on public.marketing_availability for each row execute function public.set_updated_at();
drop trigger if exists set_marketing_reservations_updated_at on public.marketing_reservations;
create trigger set_marketing_reservations_updated_at before update on public.marketing_reservations for each row execute function public.set_updated_at();

insert into public.marketing_availability (id) select gen_random_uuid() where not exists (select 1 from public.marketing_availability);

alter table public.marketing_availability enable row level security;
alter table public.marketing_blocked_dates enable row level security;
alter table public.marketing_reservations enable row level security;
drop policy if exists mavail_select on public.marketing_availability;
create policy mavail_select on public.marketing_availability for select using (true);
drop policy if exists mavail_admin on public.marketing_availability;
create policy mavail_admin on public.marketing_availability for all using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists mblocked_select on public.marketing_blocked_dates;
create policy mblocked_select on public.marketing_blocked_dates for select using (true);
drop policy if exists mblocked_admin on public.marketing_blocked_dates;
create policy mblocked_admin on public.marketing_blocked_dates for all using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists mres_admin on public.marketing_reservations;
create policy mres_admin on public.marketing_reservations for all using (public.is_superadmin()) with check (public.is_superadmin());

-- Slots disponibles de una fecha (público). Rule-based: día hábil + no bloqueado + no pasado + dentro de ventana
-- (hoy..+30d) + resta horas ya reservadas + respeta max_per_day. Devuelve jsonb array de 'HH:MM' en la tz.
create or replace function public._marketing_available_slots(_date date)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _c record; _step int; _t time; _slots jsonb := '[]'::jsonb; _taken time[]; _cnt int; _today date; _nowt time;
begin
  select * into _c from public.marketing_availability limit 1;
  if _c is null then return '[]'::jsonb; end if;
  _today := (now() at time zone _c.timezone)::date; _nowt := (now() at time zone _c.timezone)::time;
  if _date < _today or _date > _today + 30 then return '[]'::jsonb; end if;
  if not (extract(dow from _date)::int = any(_c.available_days)) then return '[]'::jsonb; end if;
  if exists (select 1 from public.marketing_blocked_dates where blocked_date = _date) then return '[]'::jsonb; end if;
  select count(*) into _cnt from public.marketing_reservations where reservation_date=_date and status <> 'cancelled';
  if _c.max_per_day > 0 and _cnt >= _c.max_per_day then return '[]'::jsonb; end if;
  select coalesce(array_agg(reservation_time), '{}') into _taken from public.marketing_reservations where reservation_date=_date and status <> 'cancelled';
  _step := greatest(_c.duration_minutes + _c.buffer_minutes, 5);
  _t := _c.hours_start;
  while _t + make_interval(mins => _c.duration_minutes) <= _c.hours_end loop
    if not (_t = any(_taken)) and not (_date = _today and _t <= _nowt) then
      _slots := _slots || to_jsonb(to_char(_t, 'HH24:MI'));
    end if;
    _t := _t + make_interval(mins => _step);
  end loop;
  return _slots;
end $fn$;
grant execute on function public._marketing_available_slots(date) to anon, authenticated;

-- Crea una reserva (público). Valida nombre/email + re-valida el slot vía _marketing_available_slots (anti
-- doble-booking / fecha bloqueada / pasada). Devuelve jsonb {status}. El insert bypassa RLS (visitante sin policy).
create or replace function public._marketing_create_reservation(_payload jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _c record; _name text; _email text; _date date; _time time; _id uuid;
begin
  select * into _c from public.marketing_availability limit 1;
  if _c is null then return jsonb_build_object('status','error','code','no_config','message','No disponible'); end if;
  _name := trim(coalesce(_payload->>'customer_name','')); _email := lower(trim(coalesce(_payload->>'customer_email','')));
  if _name='' or _email='' then return jsonb_build_object('status','error','code','invalid_payload','message','Nombre y email son requeridos'); end if;
  if _email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then return jsonb_build_object('status','error','code','invalid_email','message','Email inválido'); end if;
  begin _date := (_payload->>'reservation_date')::date; _time := (_payload->>'reservation_time')::time;
  exception when others then return jsonb_build_object('status','error','code','invalid_slot','message','Fecha u hora inválida'); end;
  if not (public._marketing_available_slots(_date) ? to_char(_time,'HH24:MI')) then
    return jsonb_build_object('status','error','code','slot_taken','message','Ese horario ya no está disponible'); end if;
  insert into public.marketing_reservations (customer_name, customer_email, customer_phone, reservation_date, reservation_time, duration_minutes, notes)
  values (_name, _email, nullif(trim(coalesce(_payload->>'customer_phone','')),''), _date, _time, _c.duration_minutes, nullif(trim(coalesce(_payload->>'message','')),''))
  returning id into _id;
  return jsonb_build_object('status','ok','reservation_id',_id);
end $fn$;
grant execute on function public._marketing_create_reservation(jsonb) to anon, authenticated;

-- Email best-effort al Super Admin (Resend/http · Vault). Aislado: si falla, la reserva entra igual.
create or replace function public._notify_marketing_reservation()
returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $fn$
declare _cid uuid := gen_random_uuid(); _key text; _status int; _resp text; _to text := 'hola@raisen.agency';
begin
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then raise warning 'reservation [%] falta resend_api_key res=%', _cid, NEW.id; return NEW; end if;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '5000');
  select status, content into _status, _resp from http(('POST', 'https://api.resend.com/emails',
    array[http_header('Authorization', 'Bearer ' || _key)], 'application/json',
    jsonb_build_object('from', 'NÚCLEO <noreply@raisen.agency>', 'to', _to,
      'subject', 'Nueva reserva de demo: ' || NEW.customer_name,
      'html', '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">'
        || '<h2 style="color:#111827">Nueva reserva de demo</h2>'
        || '<p><strong>' || public._html_escape(NEW.customer_name) || '</strong></p>'
        || '<p>' || public._html_escape(NEW.customer_email) || ' · ' || public._html_escape(coalesce(NEW.customer_phone, '—')) || '</p>'
        || '<p><strong>' || to_char(NEW.reservation_date, 'YYYY-MM-DD') || ' ' || to_char(NEW.reservation_time, 'HH24:MI') || '</strong> · ' || NEW.duration_minutes || ' min</p>'
        || case when coalesce(NEW.notes,'') <> '' then '<p style="background:#f3f4f6;padding:12px;border-radius:8px">' || public._html_escape(NEW.notes) || '</p>' else '' end
        || '</div>')::text)::http_request);
  if _status is null or _status < 200 or _status >= 300 then raise warning 'reservation [%] Resend no-2xx=% res=%', _cid, _status, NEW.id; end if;
  return NEW;
exception when others then raise warning 'reservation [%] EXCEPTION % % res=%', _cid, sqlstate, sqlerrm, NEW.id; return NEW;
end $fn$;
drop trigger if exists trg_notify_marketing_reservation on public.marketing_reservations;
create trigger trg_notify_marketing_reservation after insert on public.marketing_reservations for each row execute function public._notify_marketing_reservation();
