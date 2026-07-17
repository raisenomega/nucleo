-- payroll-external.enhance — el registro de trabajadores externos (payroll_workers) solo tenía nombre/tipo/tax_id/
-- contact/notes. El owner necesita capturar el perfil completo una sola vez: contacto desglosado (email/phone/
-- address), datos profesionales (specialty/department) y datos de pago (hourly_rate/daily_rate/payment_preference/
-- bank_account) para auto-sugerir el monto en nómina. Solo columnas aditivas; no toca RLS ni el motor fiscal.

alter table public.payroll_workers
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists hourly_rate numeric(10,2),
  add column if not exists daily_rate numeric(10,2),
  add column if not exists department text,
  add column if not exists specialty text,
  add column if not exists bank_account text,
  add column if not exists payment_preference text default 'efectivo'
    check (payment_preference in ('efectivo','ath_movil','transferencia','cheque'));
