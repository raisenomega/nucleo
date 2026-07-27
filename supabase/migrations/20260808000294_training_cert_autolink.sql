-- RRHH-0 TAREA 4: completar un curso crea automáticamente una certificación en el expediente.
-- Antes: el certificado-PDF del curso y las certificaciones del expediente eran silos sin vínculo.
-- Ahora: al marcar un enrollment 'completed', un trigger inserta la cert (source='training').

-- validez opcional del curso: si está definida, la cert hereda vencimiento (para el cron de alertas).
alter table public.training_courses add column if not exists validity_months integer;

-- distinguir certs manuales vs auto-generadas + FK al enrollment (idempotencia).
alter table public.employee_certifications
  add column if not exists source text not null default 'manual',
  add column if not exists training_enrollment_id uuid references public.training_enrollments(id) on delete set null;

create or replace function public._cert_from_training()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _course record;
begin
  if new.status = 'completed' and new.completed_at is not null
     and (tg_op = 'INSERT' or coalesce(old.status, '') <> 'completed') then
    if not exists (select 1 from public.employee_certifications where training_enrollment_id = new.id) then
      select title, validity_months into _course from public.training_courses where id = new.course_id;
      insert into public.employee_certifications(
        tenant_id, profile_id, certification_name, issued_date, expiration_date, status,
        source, training_enrollment_id)
      values (new.tenant_id, new.employee_id, coalesce(_course.title, 'Curso'), new.completed_at::date,
        case when _course.validity_months is not null
          then (new.completed_at::date + (_course.validity_months || ' months')::interval)::date end,
        'active', 'training', new.id);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_cert_from_training on public.training_enrollments;
create trigger trg_cert_from_training after insert or update on public.training_enrollments
  for each row execute function public._cert_from_training();
