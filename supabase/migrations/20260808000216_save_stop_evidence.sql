-- 216 · Evidencia de parada persistible por el rol asignado (fix del error silencioso de Stephanie).
--
-- BUG: añadir evidencia hacía UPDATE directo a route_stops desde el cliente. La policy de UPDATE exige
-- can_access_module('routes','edit'), que el rol "servicio" NO tiene → RLS filtraba 0 filas SIN error.
-- La foto subía a Storage, la miniatura aparecía (estado local), y al recargar no había nada: quedaban
-- huérfanas en el bucket. Al CEO (routes.edit) sí le funcionaba → "en unos usuarios sí y en otros no".
--
-- FIX: misma receta que complete_route_stop (082) — RPC SECURITY DEFINER cuyo guard es
-- "routes.edit O creador O ASIGNADO de la ruta". El asignado puede documentar su propia parada; nadie más.

create or replace function public.save_stop_evidence(p_stop_id uuid, p_phase text, p_paths text[])
returns void language plpgsql security definer set search_path = public as $$
declare _s public.route_stops%rowtype; _r public.service_routes%rowtype; _prefix text; _p text;
begin
  if p_phase not in ('before','after') then raise exception 'invalid phase'; end if;
  if coalesce(array_length(p_paths,1),0) > 3 then raise exception 'max 3 photos per phase'; end if;

  select * into _s from public.route_stops where id = p_stop_id and deleted_at is null;
  if not found then raise exception 'stop not found'; end if;
  select * into _r from public.service_routes where id = _s.route_id;
  if _r.tenant_id <> current_tenant() then raise exception 'not authorized'; end if;
  if not (public.can_access_module('routes','edit') or _r.created_by = auth.uid() or _r.assigned_to = auth.uid())
    then raise exception 'not authorized'; end if;

  -- Cada path debe pertenecer a ESTE stop ({tenant}/routes/{route}/{stop}/...): un rol de campo no puede
  -- adjuntar objetos arbitrarios del bucket (defensa en profundidad, mismo espíritu que el guard del 082).
  _prefix := _r.tenant_id || '/routes/' || _s.route_id || '/' || _s.id || '/';
  foreach _p in array coalesce(p_paths, '{}') loop
    if position(_prefix in _p) <> 1 then raise exception 'invalid evidence path'; end if;
  end loop;

  if p_phase = 'before' then
    update public.route_stops set evidence_before = coalesce(p_paths,'{}') where id = _s.id;
  else
    update public.route_stops set evidence_after = coalesce(p_paths,'{}') where id = _s.id;
  end if;
end $$;

revoke execute on function public.save_stop_evidence(uuid, text, text[]) from public, anon;
grant execute on function public.save_stop_evidence(uuid, text, text[]) to authenticated;

-- RESCATE (una vez): las 4 fotos que Stephanie subió el 2026-07-21 quedaron huérfanas en Storage por el
-- bug de arriba. Se adjuntan a sus paradas (los paths codifican tenant/ruta/stop — verificados en Storage).
update public.route_stops set evidence_before = array[
  '61205cb9-1418-4bfa-a029-bbb44d4e4310/routes/a406e300-7a0c-45e8-afad-1303b7aa45b2/a9c94d38-96c1-4bcd-9314-523991fe034e/before_bb6878df-8106-4f4c-a2bc-753d3616493e.jpg',
  '61205cb9-1418-4bfa-a029-bbb44d4e4310/routes/a406e300-7a0c-45e8-afad-1303b7aa45b2/a9c94d38-96c1-4bcd-9314-523991fe034e/before_0b3e590d-9c72-43b1-a260-29c490bbf023.jpg',
  '61205cb9-1418-4bfa-a029-bbb44d4e4310/routes/a406e300-7a0c-45e8-afad-1303b7aa45b2/a9c94d38-96c1-4bcd-9314-523991fe034e/before_43ba89b5-158c-4558-ab3e-a802e8301ca6.jpg']
 where id = 'a9c94d38-96c1-4bcd-9314-523991fe034e' and evidence_before = '{}';

update public.route_stops set evidence_before = array[
  '61205cb9-1418-4bfa-a029-bbb44d4e4310/routes/a406e300-7a0c-45e8-afad-1303b7aa45b2/9e201199-69a3-4f04-9a30-476cd8f0ca7c/before_e33dbe29-f3c2-47de-9499-7131c951872d.jpg']
 where id = '9e201199-69a3-4f04-9a30-476cd8f0ca7c' and evidence_before = '{}';
