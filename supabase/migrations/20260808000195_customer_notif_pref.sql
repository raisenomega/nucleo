-- Portal P5 — preferencia de notificaciones del cliente (email/push/ambos/ninguno). Aditivo sobre customer_profiles.
alter table public.customer_profiles
  add column if not exists notification_pref text not null default 'both'
    check (notification_pref in ('email','push','both','none'));
