-- RRHH-0 TAREA 6: firma dibujada opcional en observaciones.
-- digital_signature guarda la firma dibujada (data URL base64) cuando el frontend la envía;
-- si no viene, conserva el sello de auditoría de siempre (uid:employee:timestamp en base64).
-- Se elimina la versión de 4 args para evitar un overload ambiguo.
drop function if exists public.save_observation(uuid, text, text, date);

create or replace function public.save_observation(
  p_employee_id uuid, p_category text, p_notes text,
  p_follow_up date default null, p_signature text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _id uuid; _sig text; _follow boolean;
begin
  if not public.can_access_module('observations', 'create') then raise exception 'No autorizado'; end if;
  _follow := p_category in ('INCIDENTE', 'OPORTUNIDAD_MEJORA');
  _sig := coalesce(nullif(p_signature, ''),
    encode(convert_to(auth.uid()::text || ':' || p_employee_id::text || ':' || now()::text, 'UTF8'), 'base64'));
  insert into public.observations(tenant_id, employee_id, observer_id, category, notes,
    requires_follow_up, follow_up_date, digital_signature)
    values (public.current_tenant(), p_employee_id, auth.uid(), p_category, p_notes, _follow,
      case when _follow then p_follow else null end, _sig)
    returning id into _id;
  return _id;
end $$;

grant execute on function public.save_observation(uuid, text, text, date, text) to authenticated;
