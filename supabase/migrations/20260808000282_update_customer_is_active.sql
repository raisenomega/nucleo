-- Clientes · update_customer acepta is_active (rodaja 5b). Los botones staff de nota/activar hacían UPDATE directo
-- y no había policy de UPDATE para staff (0 filas, fallo silencioso). Ahora ambos rutean a este RPC definer.
create or replace function public.update_customer(_customer_id uuid, _payload jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _t uuid := public.current_tenant(); _email text := _payload->>'email';
begin
  if not public.can_access_module('customers','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  if _email is not null and _email <> '' and _email !~ '^[^@]+@[^@]+\.[^@]+$' then raise exception 'INVALID_EMAIL'; end if;
  update public.customer_profiles set
    full_name = coalesce(_payload->>'full_name', full_name), display_name = coalesce(_payload->>'display_name', display_name),
    email = coalesce(_payload->>'email', email), phone = coalesce(_payload->>'phone', phone),
    company_name = coalesce(_payload->>'company_name', company_name), tax_id = coalesce(_payload->>'tax_id', tax_id),
    customer_type = coalesce(_payload->>'customer_type', customer_type), credit_limit = coalesce((_payload->>'credit_limit')::numeric, credit_limit),
    payment_terms = coalesce(_payload->>'payment_terms', payment_terms), payment_terms_custom_days = coalesce((_payload->>'payment_terms_custom_days')::int, payment_terms_custom_days),
    discount_pct = coalesce((_payload->>'discount_pct')::numeric, discount_pct),
    is_active = coalesce((_payload->>'is_active')::boolean, is_active),
    notes_for_team = coalesce(_payload->>'notes_for_team', notes_for_team), updated_at = now()
  where id = _customer_id and tenant_id = _t;
  if not found then raise exception 'CUSTOMER_NOT_FOUND'; end if;
  return jsonb_build_object('status','ok');
end $fn$;
