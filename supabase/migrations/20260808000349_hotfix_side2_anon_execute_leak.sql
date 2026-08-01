-- HOTFIX SIDE-2 · Cierre de la fuga de EXECUTE a anon heredado por PUBLIC
--
-- CAUSA RAÍZ (migr 309, línea 116):
--   alter default privileges in schema public revoke execute on functions from anon;
-- Revoca el grant DIRECTO a anon pero NO el de PUBLIC, y anon es miembro de PUBLIC. Por eso toda función
-- creada después de la 309 nació con `=X/postgres` (PUBLIC) y quedó alcanzable desde internet vía PostgREST.
-- El comentario de la 309 ("Fail-secure: funciones futuras NO ejecutables por anon") era falso.
--
-- IMPACTO REAL (auditoría SIDE-2): 14 funciones con el bit PUBLIC. 3 son de trigger (PostgREST no las expone
-- y Postgres rechaza la llamada directa → no son fuga, y no se tocan para no arriesgar el sync de precios).
-- 5 son endpoints anon intencionales con grant explícito (el bit PUBLIC ahí es sólo higiene). Quedan 6.
--
-- LA GRAVE: _send_subscription_acceptance_email(uuid) es SECURITY DEFINER sin guard de identidad, acepta un
-- order_id arbitrario, lee el resend_api_key del Vault y dispara correo real al cliente. Un anónimo que
-- enumere UUIDs fuerza envíos no autorizados; y como la función corta con `if acceptance_email_sent_at is not
-- null then return`, quemar ese flag IMPIDE PARA SIEMPRE el envío legítimo → DoS del correo de contrato.

-- 1) Revocar PUBLIC (y anon por si acaso) de las 6 que nunca debieron ser alcanzables sin auth.
--    Firmas verificadas contra pg_get_function_identity_arguments en prod, no asumidas.
--    Las 6 conservan authenticated + service_role, así que el panel y los webhooks siguen intactos.
revoke execute on function public._send_subscription_acceptance_email(uuid) from public, anon;
revoke execute on function public.get_subscriptions() from public, anon;
revoke execute on function public.is_demo_tenant() from public, anon;
revoke execute on function public.cancel_subscription(uuid) from public, anon;
revoke execute on function public._fmt_price(numeric) from public, anon;
revoke execute on function public._field_pricing_rule(uuid, uuid, text) from public, anon;

-- 2) Higiene en los 5 endpoints anon LEGÍTIMOS: se quita el bit PUBLIC y se deja SOLO el grant explícito a
--    anon, que es el que documenta la intención. Verificado que las 5 ya tenían `anon=X/postgres`, así que
--    quitar PUBLIC no les cambia la superficie — sólo la hace auditable.
revoke execute on function public.check_ip_allowed(text) from public;
revoke execute on function public.create_stripe_checkout_session(text, text) from public;
revoke execute on function public.create_stripe_subscription_checkout(text) from public;
revoke execute on function public.log_login_failed(text, text, text) from public;
revoke execute on function public.public_invoice_pay_options(text) from public;

grant execute on function public.check_ip_allowed(text) to anon;
grant execute on function public.create_stripe_checkout_session(text, text) to anon;
grant execute on function public.create_stripe_subscription_checkout(text) to anon;
grant execute on function public.log_login_failed(text, text, text) to anon;
grant execute on function public.public_invoice_pay_options(text) to anon;

-- 3) Fix de la causa raíz. En prod el pg_default_acl de postgres YA está limpio (alguien lo corrigió a mano:
--    `grep "default privileges"` en las 348 migraciones sólo devuelve la línea 116 de la 309). Esto es drift
--    schema↔migraciones: con `supabase db reset` el fail-open volvería. Se materializa aquí para eliminarlo.
--    Idempotente: si ya está aplicado, no cambia nada.
alter default privileges in schema public revoke execute on functions from public, anon;

-- 4) Traza. tenant_id NULL a propósito: es un evento de plataforma, no de un tenant (la columna es nullable).
insert into public.audit_log (tenant_id, action, entity_type, new_values, risk_level)
values (null, 'side2_anon_execute_hotfix', 'security',
  jsonb_build_object(
    'revoked_public', 6, 'hygiene_revoked_public', 5, 'trigger_fns_left_alone', 3,
    'root_cause', 'migr_309_line_116_revoked_from_anon_but_not_from_public',
    'worst_case_closed', '_send_subscription_acceptance_email: envio no autorizado + DoS del correo',
    'migration', '20260808000349'),
  'critical');
