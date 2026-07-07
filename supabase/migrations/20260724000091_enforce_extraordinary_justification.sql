-- 20260724000091_enforce_extraordinary_justification.sql
-- PUENTE DE AUTO-CONTABILIDAD (6/6): justificación obligatoria (≥20 chars) en pagos extraordinarios,
-- a nivel DB (defensa en profundidad; hoy solo se valida en la UI).

create or replace function public.enforce_extraordinary_justification()
returns trigger language plpgsql set search_path = public as $$
begin
  if length(coalesce(NEW.justification, '')) < 20 then
    raise exception 'Justificación debe tener al menos 20 caracteres';
  end if;
  return NEW;
end $$;

drop trigger if exists trg_extra_justification on public.extraordinary_payments;
create trigger trg_extra_justification before insert or update on public.extraordinary_payments
  for each row execute function public.enforce_extraordinary_justification();
