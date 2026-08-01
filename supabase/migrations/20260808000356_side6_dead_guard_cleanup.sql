-- SIDE-6 (cierre) · Retirar guards muertos introducidos en la migr 353.
--
-- QUE PASO: en SIDE-5 anadi a estas dos funciones un guard
--     if current_user not in ('postgres','service_role') then raise exception 'forbidden' ...
-- y lo presente como defensa en profundidad. NO LO ES. Dentro de una funcion SECURITY DEFINER,
-- `current_user` devuelve siempre el PROPIETARIO de la funcion (postgres), nunca el rol que llama.
-- Comprobado con una sonda: una funcion DEFINER invocada por `authenticated` ve current_user='postgres',
-- mientras que la misma funcion como INVOKER ve current_user='authenticated'. El guard no podia bloquear
-- a nadie: pasaba igual para un cron que para un atacante con sesion.
--
-- POR QUE SE RETIRA EN VEZ DE DEJARLO: es inofensivo en ejecucion pero es una mentira estructural. Quien
-- lea `_vault_upsert` hoy concluye que esta protegida por ahi, y no lo esta. Un control que aparenta
-- proteger sin proteger es peor que ninguno, porque desactiva la sospecha.
--
-- LO QUE DE VERDAD PROTEGE: el REVOKE de anon+authenticated (migr 353 y 355a), verificado end-to-end con
-- `set local role authenticated` -> 42501 permission denied. La segunda capa real es el test de CI
-- grants-coverage, que falla si alguna de estas funciones recupera el privilegio.
--
-- Cuerpos byte-identicos a los de produccion salvo la eliminacion del guard y el comentario que lo explica.

CREATE OR REPLACE FUNCTION public._send_security_email(p_to text, p_subject text, p_body_html text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare _key text;
begin
  -- SEGURIDAD: la proteccion de esta funcion es el REVOKE de anon+authenticated, NADA MAS.
  -- Aqui hubo un guard `current_user not in (...)` y era codigo muerto: dentro de una funcion
  -- SECURITY DEFINER current_user es SIEMPRE el propietario (postgres), no quien llama, asi que
  -- pasaba igual para un cron que para un atacante con sesion. Verificado empiricamente.
  -- No lo reintroduzcas: si quieres una segunda capa, el test grants-coverage es la que sirve.
  if coalesce(p_to,'')='' then return; end if;
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _key is null then return; end if;   -- gap documentado: sin RESEND_API_KEY no hay email
  begin
    perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
    perform http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],
      'application/json', jsonb_build_object('from','NÚCLEO Security <noreply@raisen.agency>','to',p_to,
        'subject',left(p_subject,200),'html',p_body_html)::text)::http_request);
  exception when others then
    -- Antes: `then null`. Un fallo de envío de una ALERTA DE SEGURIDAD desaparecía sin rastro.
    insert into public.audit_log(tenant_id, action, entity_type, new_values, risk_level)
      values(null, 'security_email_failed', 'security',
             jsonb_build_object('to', p_to, 'sqlstate', sqlstate, 'error', sqlerrm), 'high');
  end;
end $function$;

revoke execute on function public._send_security_email(text, text, text) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public._vault_upsert(_name text, _secret text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare _id uuid;
begin
  -- SEGURIDAD: la proteccion de esta funcion es el REVOKE de anon+authenticated, NADA MAS.
  -- Aqui hubo un guard `current_user not in (...)` y era codigo muerto: dentro de una funcion
  -- SECURITY DEFINER current_user es SIEMPRE el propietario (postgres), no quien llama, asi que
  -- pasaba igual para un cron que para un atacante con sesion. Verificado empiricamente.
  -- No lo reintroduzcas: si quieres una segunda capa, el test grants-coverage es la que sirve.
  select id into _id from vault.secrets where name = _name limit 1;
  if _id is not null then perform vault.update_secret(_id, _secret, _name);
  else perform vault.create_secret(_secret, _name); end if;
end $function$;

revoke execute on function public._vault_upsert(text, text) from public, anon, authenticated;

insert into public.audit_log (tenant_id, action, entity_type, new_values, risk_level)
values (null, 'side6_dead_guard_cleanup', 'security',
  jsonb_build_object(
    'funciones', jsonb_build_array('_vault_upsert','_send_security_email'),
    'motivo', 'current_user dentro de SECURITY DEFINER devuelve el owner, no el caller: el guard nunca bloqueo nada',
    'proteccion_real', 'revoke de anon+authenticated (migr 353 y 355a) + test CI grants-coverage',
    'migration', '20260808000356'),
  'low');
