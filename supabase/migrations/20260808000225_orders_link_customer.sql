-- 225 · Ola 2.1d-i · Enlazar tenant_landing_orders al maestro de clientes + auto-populate por email.
--
-- Las órdenes guardaban el cliente como texto (customer_name/email/phone) sin FK. Añadimos customer_id NULLABLE
-- (100% aditivo: hoy NADA lee customer_id en ventas → cero breakage; el texto libre queda como fallback).
-- Un trigger BEFORE INSERT auto-enlaza cada orden nueva a su customer_profile (creándolo si falta, source
-- 'landing_order') → el maestro se auto-puebla sin fricción en el checkout anónimo. Un backfill idempotente
-- enlaza las órdenes ya existentes, deduplicando por (tenant, lower(trim(email))).
--
-- DESVIACIÓN DELIBERADA vs el prompt: el índice unique NO es global sino PARCIAL sobre perfiles anónimos
-- (user_id IS NULL). Un unique global (tenant, lower(email)) rompería el alta del portal: register_customer hace
-- `insert ... on conflict (tenant_id, user_id) do update`; si esa persona ya ordenó antes (perfil landing_order
-- con su email, user_id null), su signup violaría el unique por email y el on-conflict (otro target) no lo captura
-- → excepción → registro roto. El índice parcial protege el path de órdenes contra duplicados sin tocar el portal.
-- La fusión anónimo↔portal en el signup queda como follow-up (actualizar register_customer en su propia rodaja).

-- 1. FK aditivo nullable + índice
alter table public.tenant_landing_orders
  add column if not exists customer_id uuid references public.customer_profiles(id) on delete set null;
create index if not exists idx_tlo_customer on public.tenant_landing_orders (customer_id);

-- 2. Resolver por email (reutilizable, race-safe). Prefiere un perfil existente (portal o anónimo, case-insensitive);
--    si no hay, crea uno anónimo source='landing_order'. Uso interno (trigger/backfill definer) → sin grants.
create or replace function public._resolve_customer_by_email(_tenant uuid, _email text, _name text, _phone text)
returns uuid language plpgsql security definer set search_path = public as $$
declare _norm text := lower(trim(_email)); _id uuid;
begin
  if _norm is null or _norm = '' then return null; end if;
  select id into _id from public.customer_profiles where tenant_id = _tenant and lower(trim(email)) = _norm limit 1;
  if _id is not null then return _id; end if;
  begin
    insert into public.customer_profiles (tenant_id, user_id, full_name, email, phone, source, is_active)
      values (_tenant, null, coalesce(nullif(trim(_name), ''), _norm), _email, nullif(trim(_phone), ''), 'landing_order', true)
      returning id into _id;
  exception when unique_violation then  -- carrera: otro insert ganó → re-selecciona el existente
    select id into _id from public.customer_profiles where tenant_id = _tenant and lower(trim(email)) = _norm limit 1;
  end;
  return _id;
end $$;

-- 3. Trigger BEFORE INSERT → setea customer_id sin un segundo UPDATE
create or replace function public._tlo_autolink_customer()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.customer_id is null and new.customer_email is not null then
    new.customer_id := public._resolve_customer_by_email(new.tenant_id, new.customer_email, new.customer_name, new.customer_phone);
  end if;
  return new;
end $$;
drop trigger if exists tlo_autolink_customer on public.tenant_landing_orders;
create trigger tlo_autolink_customer before insert on public.tenant_landing_orders
  for each row execute function public._tlo_autolink_customer();

-- 4. Backfill idempotente: enlaza órdenes existentes, dedup por (tenant, lower(trim(email))),
--    nombre canónico = el más reciente no vacío (DISTINCT ON ... order by created_at desc).
create or replace function public.backfill_orders_customers()
returns jsonb language plpgsql security definer set search_path = public as $$
declare _rec record; _cid uuid; _emails int := 0; _before int; _after int;
begin
  if not public.is_superadmin() and not public.is_ceo_or_above() then raise exception 'NOT_AUTHORIZED'; end if;
  select count(*) into _before from public.customer_profiles where source = 'landing_order';
  for _rec in
    select distinct on (tenant_id, lower(trim(customer_email))) tenant_id, customer_email, customer_name, customer_phone
    from public.tenant_landing_orders
    where customer_id is null and customer_email is not null and trim(customer_email) <> ''
    order by tenant_id, lower(trim(customer_email)), created_at desc
  loop
    _cid := public._resolve_customer_by_email(_rec.tenant_id, _rec.customer_email, _rec.customer_name, _rec.customer_phone);
    update public.tenant_landing_orders set customer_id = _cid
      where tenant_id = _rec.tenant_id and lower(trim(customer_email)) = lower(trim(_rec.customer_email)) and customer_id is null;
    _emails := _emails + 1;
  end loop;
  select count(*) into _after from public.customer_profiles where source = 'landing_order';
  return jsonb_build_object('status', 'ok', 'emails_processed', _emails, 'customers_created', _after - _before);
end $$;

revoke execute on function public._resolve_customer_by_email(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public._tlo_autolink_customer() from public, anon, authenticated;
revoke execute on function public.backfill_orders_customers() from public, anon;
grant execute on function public.backfill_orders_customers() to authenticated;

-- 5. Ejecutar el backfill una vez. Claim superadmin TRANSACTION-LOCAL para pasar el gate bajo cualquier
--    contexto de apply (Management API / supabase db push / CI corren migraciones sin claims JWT).
do $$ begin
  perform set_config('request.jwt.claims', '{"user_role":"superadmin"}', true);
  perform public.backfill_orders_customers();
end $$;

-- 6. Índice unique anti-duplicados SOLO en perfiles anónimos (user_id null) — protege el path de órdenes
--    sin romper el alta del portal (que inserta user_id NOT NULL). Ver nota de cabecera.
create unique index if not exists uq_customer_profiles_tenant_email_anon
  on public.customer_profiles (tenant_id, lower(trim(email)))
  where user_id is null and email is not null and trim(email) <> '';
