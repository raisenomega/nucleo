-- 20260705000016_fix_auth_hook_role_claim.sql
-- BUG 401: el hook pisaba el claim 'role' con el rol de app (p.ej. 'ceo'). PostgREST usa 'role'
-- para SET ROLE en Postgres y solo acepta anon/authenticated/service_role → error 22023 → 401.
-- Fix: NO tocar 'role' (queda 'authenticated'); el rol de app va en el claim 'user_role'.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable security definer
set search_path = public as $$
declare
  _uid uuid := (event->'claims'->>'sub')::uuid;
  _tenant uuid; _role text; _claims jsonb := event->'claims';
begin
  select tenant_id into _tenant from public.profiles where id = _uid;
  select role::text into _role from public.user_roles
    where user_id = _uid and tenant_id = _tenant limit 1;
  if _tenant is not null then _claims := jsonb_set(_claims,'{tenant_id}',to_jsonb(_tenant)); end if;
  -- 'role' NO se toca (PostgREST lo usa para SET ROLE). El rol de app va en 'user_role'.
  if _role   is not null then _claims := jsonb_set(_claims,'{user_role}',to_jsonb(_role)); end if;
  return jsonb_set(event,'{claims}',_claims);
end; $$;

-- Helpers de rol: ahora leen el claim 'user_role' (antes 'role').
create or replace function public.is_superadmin() returns boolean language sql stable as $$
  select (current_setting('request.jwt.claims', true)::jsonb->>'user_role') = 'superadmin' $$;
create or replace function public.is_ceo_or_above() returns boolean language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb->>'user_role','') in ('superadmin','ceo') $$;
create or replace function public.is_coo_or_above() returns boolean language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb->>'user_role','') in ('superadmin','ceo','coo') $$;
