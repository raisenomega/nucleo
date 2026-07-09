-- 20260808000114_allowed_emails_check.sql
-- Bloquea emails vacíos/inválidos en allowed_emails (bug: fila con email='' -> 422 en Resend).
-- Defensa en profundidad: el frontend valida primero; este CHECK es la última línea.

-- Limpia filas basura existentes (email vacío o no-email) ANTES de agregar el constraint.
delete from public.allowed_emails
  where email = '' or email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$';

alter table public.allowed_emails add constraint allowed_emails_email_check
  check (email <> '' and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');
