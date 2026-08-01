-- Micro-hotfix · phone hijacking en el auto-vinculado de clientes.
-- Origen: auditoría E2E 2026-08-01, hallazgo §12 #6, con el diagnóstico CORREGIDO.
--
-- El defecto NO es el acceso al portal: la identidad es auth.uid() y la policy cp_select_own
-- (user_id = auth.uid()) lo protege bien. Nadie entra como otro cambiándose el teléfono.
--
-- El defecto está en la dirección contraria, en la ATRIBUCIÓN de registros nuevos:
--   · update_my_customer deja al cliente fijar un `phone` arbitrario,
--   · customer_profiles NO tiene índice único sobre phone,
--   · _resolve_customer_by_phone hacía `limit 1` SIN order by → elección no determinista,
--   · y el trigger _route_stop_autolink_customer usa eso para asignar customer_id a cada parada nueva.
-- Resultado: quien ponga el teléfono de otro desvía hacia sí las paradas de servicio FUTURAS.
--
-- Y no es hipotético: HOY ya hay teléfonos compartidos en producción (3 perfiles con el mismo número en
-- Zafacones). Sin este fix, esas paradas se atribuyen a un perfil elegido al azar. Con él, se quedan sin
-- atribuir — que es lo correcto: mejor un registro sin dueño que un registro con el dueño equivocado.

-- ---------------------------------------------------------------------------------------------------
-- D · Resolver sólo cuando la coincidencia es ÚNICA.
--     Ante ambigüedad devuelve null y deja traza. El teléfono se registra HASHEADO: es un dato personal
--     y el audit_log no es el sitio para guardarlo en claro.
-- ---------------------------------------------------------------------------------------------------
create or replace function public._resolve_customer_by_phone(_tenant uuid, _phone text)
returns uuid language plpgsql security definer set search_path to 'public','extensions' as $$
-- array_agg y no min(): en Postgres no existe min(uuid). Con el filtro por tenant + dígitos exactos el
-- conjunto es de una o dos filas, así que agregarlo es trivial y ahorra una segunda consulta.
declare _digits text := regexp_replace(coalesce(_phone,''), '\D', '', 'g'); _ids uuid[]; _n int;
begin
  if length(_digits) < 7 then return null; end if;
  select array_agg(id) into _ids from public.customer_profiles
   where tenant_id = _tenant and regexp_replace(coalesce(phone,''), '\D', '', 'g') = _digits;
  _n := coalesce(array_length(_ids, 1), 0);
  if _n = 1 then return _ids[1]; end if;
  if _n > 1 then
    insert into public.audit_log(tenant_id, action, entity_type, new_values, risk_level)
      values(_tenant, 'phone_resolve_ambiguous', 'customer',
             jsonb_build_object('phone_sha256', encode(digest(_digits,'sha256'),'hex'), 'matches', _n), 'low');
  end if;
  return null;   -- sin match, o con match ambiguo: no se atribuye a nadie
end $$;
revoke execute on function public._resolve_customer_by_phone(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------
-- E · El cliente deja de poder cambiar su propio teléfono.
--     Se retira `phone` del conjunto editable. Si el frontend lo sigue enviando, se ignora en silencio:
--     devolver un error rompería el guardado del resto del perfil sin que el usuario entienda por qué.
--     El teléfono pasa a ser competencia del staff (update_customer), que es quien puede verificarlo.
--     NOTA: el resto de campos queda EXACTAMENTE igual que antes; esto no es una reescritura.
-- ---------------------------------------------------------------------------------------------------
create or replace function public.update_my_customer(_payload jsonb)
returns void language plpgsql security definer set search_path to 'public' as $$
declare _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'No autenticado'; end if;
  update public.customer_profiles set
    full_name          = coalesce(_payload->>'full_name', full_name),
    -- phone: RETIRADO a propósito. Era la palanca del phone hijacking; lo cambia el staff.
    address            = coalesce(_payload->>'address', address),
    city               = coalesce(_payload->>'city', city),
    state              = coalesce(_payload->>'state', state),
    zip_code           = coalesce(_payload->>'zip_code', zip_code),
    photo_url          = coalesce(_payload->>'photo_url', photo_url),
    contact_preference = coalesce(_payload->>'contact_preference', contact_preference),
    language           = coalesce(_payload->>'language', language),
    notification_pref  = coalesce(_payload->>'notification_pref', notification_pref),
    updated_at = now()
  where user_id = _uid;  -- campos internos (notes_for_team, credit_limit, segment_id, discount_pct, on_hold…) NO se tocan
end $$;
revoke execute on function public.update_my_customer(jsonb) from public, anon;
grant execute on function public.update_my_customer(jsonb) to authenticated;

insert into public.audit_log (tenant_id, action, entity_type, new_values, risk_level)
values (null, 'phone_hijacking_fix_applied', 'security',
  jsonb_build_object(
    'D', '_resolve_customer_by_phone: null si la coincidencia no es unica',
    'E', 'update_my_customer: phone retirado del conjunto editable',
    'nota', 'ya existian telefonos duplicados en prod: esas paradas dejan de auto-atribuirse',
    'pendiente', 'frontend PortalProfileForm.tsx sigue mostrando el input de telefono',
    'migration', '20260808000354'),
  'high');
