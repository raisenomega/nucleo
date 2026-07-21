-- 222 · Ola 2.1a · Maestro de clientes: extender customer_profiles + alta/edición manual.
--
-- Hoy customer_profiles es solo directorio de portal (user_id NOT NULL → todo cliente exige cuenta; un
-- comprador sin registro no puede tener ficha) y el staff solo puede leer. Esta rodaja lo vuelve un maestro:
-- user_id nullable (clientes manuales sin portal), campos comerciales, y RPCs de alta/edición gateadas.
--
-- Verificado contra la DB viva: `phone` y `language` YA existen (no se duplican); UNIQUE(tenant_id, user_id)
-- permite múltiples NULL en Postgres → sin cambios (varios manuales conviven). La RLS NO se toca: las RPCs son
-- SECURITY DEFINER (bypasean RLS con su propio gate), la policy staff `cp_select_staff` (tenant_id =
-- current_tenant) ya muestra los manuales, y `cp_select_own` (user_id = auth.uid) nunca matchea user_id NULL →
-- los manuales quedan invisibles al portal.

-- 1 · user_id nullable (cliente manual = sin cuenta de portal).
alter table public.customer_profiles alter column user_id drop not null;

-- 2 · Campos de maestro ERP (phone/language ya existen; NO se agregan).
alter table public.customer_profiles
  add column if not exists display_name text,
  add column if not exists company_name text,
  add column if not exists tax_id text,
  add column if not exists customer_type text not null default 'individual',
  add column if not exists source text not null default 'portal',
  add column if not exists credit_limit numeric(12,2) not null default 0,
  add column if not exists payment_terms text not null default 'immediate',
  add column if not exists payment_terms_custom_days int;

alter table public.customer_profiles drop constraint if exists customer_profiles_type_check;
alter table public.customer_profiles add constraint customer_profiles_type_check check (customer_type in ('individual','business'));
alter table public.customer_profiles drop constraint if exists customer_profiles_source_check;
alter table public.customer_profiles add constraint customer_profiles_source_check check (source in ('portal','manual','import','landing_order'));
alter table public.customer_profiles drop constraint if exists customer_profiles_terms_check;
alter table public.customer_profiles add constraint customer_profiles_terms_check check (payment_terms in ('immediate','net_15','net_30','net_60','net_90','custom'));

create index if not exists idx_customer_profiles_search on public.customer_profiles (tenant_id, display_name, email);

-- 3 · Alta manual. full_name = nombre canónico que ya muestra la lista; display_name = razón social opcional.
create or replace function public.create_customer(_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _t uuid := public.current_tenant(); _id uuid; _email text := nullif(_payload->>'email','');
begin
  if not public.can_access_module('customers','create') then raise exception 'NOT_AUTHORIZED'; end if;
  if coalesce(trim(_payload->>'full_name'),'') = '' then raise exception 'NAME_REQUIRED'; end if;
  if _email is not null and _email !~ '^[^@]+@[^@]+\.[^@]+$' then raise exception 'INVALID_EMAIL'; end if;

  insert into public.customer_profiles (tenant_id, user_id, full_name, display_name, email, phone, company_name,
    tax_id, customer_type, source, credit_limit, payment_terms, payment_terms_custom_days, language, notes_for_team, is_active)
  values (_t, null, _payload->>'full_name', nullif(_payload->>'display_name',''), _email, nullif(_payload->>'phone',''),
    nullif(_payload->>'company_name',''), nullif(_payload->>'tax_id',''),
    coalesce(_payload->>'customer_type','individual'), 'manual',
    coalesce((_payload->>'credit_limit')::numeric, 0), coalesce(_payload->>'payment_terms','immediate'),
    (_payload->>'payment_terms_custom_days')::int, coalesce(_payload->>'language','es'),
    nullif(_payload->>'notes_for_team',''), true)
  returning id into _id;
  return jsonb_build_object('status','ok','customer_id',_id);
end $$;

-- 4 · Edición completa (COALESCE: solo pisa lo que viene en el payload).
create or replace function public.update_customer(_customer_id uuid, _payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _t uuid := public.current_tenant(); _email text := _payload->>'email';
begin
  if not public.can_access_module('customers','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  if _email is not null and _email <> '' and _email !~ '^[^@]+@[^@]+\.[^@]+$' then raise exception 'INVALID_EMAIL'; end if;

  update public.customer_profiles set
    full_name = coalesce(_payload->>'full_name', full_name),
    display_name = coalesce(_payload->>'display_name', display_name),
    email = coalesce(_payload->>'email', email),
    phone = coalesce(_payload->>'phone', phone),
    company_name = coalesce(_payload->>'company_name', company_name),
    tax_id = coalesce(_payload->>'tax_id', tax_id),
    customer_type = coalesce(_payload->>'customer_type', customer_type),
    credit_limit = coalesce((_payload->>'credit_limit')::numeric, credit_limit),
    payment_terms = coalesce(_payload->>'payment_terms', payment_terms),
    payment_terms_custom_days = coalesce((_payload->>'payment_terms_custom_days')::int, payment_terms_custom_days),
    notes_for_team = coalesce(_payload->>'notes_for_team', notes_for_team), updated_at = now()
  where id = _customer_id and tenant_id = _t;
  if not found then raise exception 'CUSTOMER_NOT_FOUND'; end if;
  return jsonb_build_object('status','ok');
end $$;

revoke execute on function public.create_customer(jsonb), public.update_customer(uuid,jsonb) from public, anon;
grant execute on function public.create_customer(jsonb), public.update_customer(uuid,jsonb) to authenticated;
