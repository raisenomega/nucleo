-- 20260808000111_self_signup_and_reconnect.sql
-- Cierra el bug de /registro (usuarios huérfanos): handle_new_user extendido para self-signup trial.
-- Seed extraído a private._seed_trial_tenant (un solo lugar, sin drift con create_trial_tenant).
-- Logging WARNING-only (los logs de Postgres sobreviven al rollback; sin dblink no hay INSERT autónomo).
-- SIN handle_login_reconnect (fuera de alcance; Runbook (b) queda como referencia documental).

-- ── Helper: seed invariante del tenant trial (categorías + settings fijos). Llamado por el trigger
--    y por create_trial_tenant. El contact_phone (per-signup) lo pone cada caller, no el helper.
create schema if not exists private;
create or replace function private._seed_trial_tenant(_tenant_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.settings (tenant_id, key, value) values
    (_tenant_id, 'order_prefix', to_jsonb('TR'::text)),
    (_tenant_id, 'retention_enabled', to_jsonb(false))
  on conflict (tenant_id, key) do nothing;
  insert into public.categories (tenant_id, kind, label, sort) values
    (_tenant_id,'income','Ventas',1),(_tenant_id,'income','Servicios',2),(_tenant_id,'income','Otros ingresos',3),
    (_tenant_id,'expense','Nómina',1),(_tenant_id,'expense','Insumos',2),(_tenant_id,'expense','Renta',3),
    (_tenant_id,'payment_method','Efectivo',1),(_tenant_id,'payment_method','Transferencia',2),
    (_tenant_id,'support_category','IT',1),(_tenant_id,'support_category','RRHH',2),(_tenant_id,'support_category','Operaciones',3),
    (_tenant_id,'support_category','Instalaciones',4),(_tenant_id,'support_category','Otro',5);
end; $$;

-- ── handle_new_user: invitado (allowed_emails) → su tenant · self-signup → tenant trial nuevo.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  _email text := lower(NEW.email);
  _allowed public.allowed_emails%rowtype;
  _tenant uuid; _slug text; _biz text; _name text; _phone text;
begin
  if exists (select 1 from public.profiles where id = NEW.id) then return NEW; end if;   -- idempotente

  select * into _allowed from public.allowed_emails where lower(email) = _email limit 1;
  if found then                                                                           -- invitado
    insert into public.profiles (id, tenant_id, email, full_name, status, approved_at)
      values (NEW.id, _allowed.tenant_id, _email, _allowed.full_name, 'approved', now()) on conflict (id) do nothing;
    insert into public.user_roles (tenant_id, user_id, role)
      values (_allowed.tenant_id, NEW.id, _allowed.role) on conflict (tenant_id, user_id, role) do nothing;
    return NEW;
  end if;

  -- self-signup trial (metadata pasada por signUp options.data). Fallbacks para metadata ausente.
  _biz   := nullif(trim(NEW.raw_user_meta_data->>'business_name'), '');
  _name  := coalesce(nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''), split_part(_email, '@', 1));
  _phone := nullif(trim(NEW.raw_user_meta_data->>'phone'), '');
  _slug  := case when _biz is null then substr(md5(gen_random_uuid()::text), 1, 12)        -- sin business → solo hex
                 else trim(both '-' from lower(regexp_replace(_biz, '[^a-z0-9]+', '-', 'gi')))
                      || '-' || substr(md5(gen_random_uuid()::text), 1, 6) end;
  insert into public.tenants (slug, legal_name, status, expires_at)
    values (_slug, coalesce(_biz, 'Mi Negocio'), 'trial', now() + interval '7 days') returning id into _tenant;
  insert into public.profiles (id, tenant_id, email, full_name, status, approved_at)
    values (NEW.id, _tenant, _email, _name, 'approved', now()) on conflict (id) do nothing;
  insert into public.user_roles (tenant_id, user_id, role)
    values (_tenant, NEW.id, 'ceo') on conflict (tenant_id, user_id, role) do nothing;
  if _phone is not null then
    insert into public.settings (tenant_id, key, value) values (_tenant, 'contact_phone', to_jsonb(_phone));
  end if;
  perform private._seed_trial_tenant(_tenant);
  return NEW;
exception when others then
  raise warning 'handle_new_user failed: user_id=% email=% sqlstate=% sqlerrm=%', NEW.id, NEW.email, sqlstate, sqlerrm;
  raise;                                                                                  -- re-lanza → sin huérfanos
end; $$;

-- Asegura el trigger (no lo dropea si ya existe y funciona).
do $$
begin
  if not exists (
    select 1 from pg_trigger t join pg_class c on t.tgrelid=c.oid join pg_namespace n on c.relnamespace=n.oid
    where n.nspname='auth' and c.relname='users' and t.tgname='on_auth_user_created' and not t.tgisinternal
  ) then
    create trigger on_auth_user_created after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;

-- ── create_trial_tenant: refactor para usar el helper (sin drift). Sigue viva (deprecada, no dropeada).
create or replace function public.create_trial_tenant(
  name text, email text, business_name text, phone text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare _uid uuid := auth.uid(); _email text; _tenant uuid; _slug text;
begin
  if _uid is null then return jsonb_build_object('error', 'no autenticado'); end if;
  select u.email into _email from auth.users u where u.id = _uid;
  if _email is null then return jsonb_build_object('error', 'usuario no encontrado'); end if;
  if exists (select 1 from public.profiles where id = _uid) then
    return jsonb_build_object('error', 'el usuario ya pertenece a un tenant');
  end if;
  _slug := trim(both '-' from lower(regexp_replace(business_name, '[^a-z0-9]+', '-', 'gi')))
           || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
  insert into public.tenants (slug, legal_name, status, expires_at)
    values (_slug, business_name, 'trial', now() + interval '7 days') returning id into _tenant;
  insert into public.profiles (id, tenant_id, email, full_name, status)
    values (_uid, _tenant, _email, name, 'approved');
  insert into public.user_roles (tenant_id, user_id, role) values (_tenant, _uid, 'ceo');
  if nullif(trim(phone), '') is not null then
    insert into public.settings (tenant_id, key, value) values (_tenant, 'contact_phone', to_jsonb(phone));
  end if;
  perform private._seed_trial_tenant(_tenant);
  return jsonb_build_object('tenant_id', _tenant);
end; $$;
grant execute on function public.create_trial_tenant(text,text,text,text) to authenticated;
