-- 20260705000010_auth_hook_and_helpers.sql
-- Slice #1 Auth: Custom Access Token Hook (inyecta tenant_id + role al JWT) + helpers de rol + PIN.
-- Modelo: 1 usuario = 1 tenant (profiles.tenant_id). SECURITY DEFINER bypassa RLS para leer.

create extension if not exists pgcrypto with schema extensions;

-- 1) Auth Hook — Supabase lo invoca al emitir el token; añade tenant_id + role como claims top-level.
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
  if _role   is not null then _claims := jsonb_set(_claims,'{role}',to_jsonb(_role)); end if;
  return jsonb_set(event,'{claims}',_claims);
end; $$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- 2) Helpers de rol — leen el claim 'role' del JWT (superadmin>ceo>coo>operaciones>servicio).
create or replace function public.is_superadmin() returns boolean language sql stable as $$
  select (current_setting('request.jwt.claims', true)::jsonb->>'role') = 'superadmin' $$;
create or replace function public.is_ceo_or_above() returns boolean language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role','') in ('superadmin','ceo') $$;
create or replace function public.is_coo_or_above() returns boolean language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role','') in ('superadmin','ceo','coo') $$;

-- 3) PIN (bcrypt via pgcrypto) — set/verify sobre el propio perfil (auth.uid()).
create or replace function public.set_my_pin(new_pin text)
returns void language sql security definer set search_path = public, extensions as $$
  update public.profiles set pin_hash = crypt(new_pin, gen_salt('bf')) where id = auth.uid()
$$;

create or replace function public.verify_my_pin(pin text)
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select coalesce(pin_hash = crypt(pin, pin_hash), false) from public.profiles where id = auth.uid()
$$;
