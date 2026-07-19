-- 196 · BUG A del Portal del Cliente: handle_new_user creaba un TENANT TRIAL + profile + rol CEO
-- para TODO usuario nuevo no invitado — incluyendo clientes que se registran por el portal.
-- El cliente quedaba como "staff" (claims tenant_id/user_role del auth hook) → veía "Sesión de negocio".
-- Fix: rama 'customer_portal' (metadata signup_source de signUpCustomer/magicLinkCustomer) ANTES del
-- fallback trial: NO crea tenant/profile/rol; crea el customer_profile directo si la metadata trae
-- portal_tenant_id válido (best-effort: si falla, el guard del portal lo auto-crea vía register_customer).
-- Orden de precedencia: profiles existente > allowed_emails (staff invitado) > portal > self-signup trial.
-- NO toca custom_access_token_hook. El flujo de staff invitado y el trial del founder quedan intactos.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  _email text := lower(NEW.email);
  _allowed public.allowed_emails%rowtype;
  _tenant uuid; _slug text; _biz text; _name text; _phone text; _ptenant uuid;
begin
  if exists (select 1 from public.profiles where id = NEW.id) then return NEW; end if;   -- idempotente

  select * into _allowed from public.allowed_emails where lower(email) = _email limit 1;
  if found then                                                                           -- invitado (staff)
    insert into public.profiles (id, tenant_id, email, full_name, status, approved_at)
      values (NEW.id, _allowed.tenant_id, _email, _allowed.full_name, 'approved', now()) on conflict (id) do nothing;
    insert into public.user_roles (tenant_id, user_id, role)
      values (_allowed.tenant_id, NEW.id, _allowed.role) on conflict (tenant_id, user_id, role) do nothing;
    return NEW;
  end if;

  if NEW.raw_user_meta_data->>'signup_source' = 'customer_portal' then                    -- cliente del portal
    begin  -- best-effort: nunca bloquea el signup; el guard del portal completa el perfil si esto falla
      _ptenant := nullif(NEW.raw_user_meta_data->>'portal_tenant_id', '')::uuid;
      if _ptenant is not null and exists (select 1 from public.tenants where id = _ptenant) then
        insert into public.customer_profiles (tenant_id, user_id, full_name, email, phone)
          values (_ptenant, NEW.id, nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''), _email,
                  nullif(trim(NEW.raw_user_meta_data->>'phone'), ''))
          on conflict (tenant_id, user_id) do nothing;
      end if;
    exception when others then
      raise warning 'portal signup: customer_profile diferido user=% err=%', NEW.id, sqlerrm;
    end;
    return NEW;                                                                           -- SIN tenant/profile/rol
  end if;

  -- self-signup trial del founder (metadata pasada por signUp options.data). Fallbacks para metadata ausente.
  _biz   := nullif(trim(NEW.raw_user_meta_data->>'business_name'), '');
  _name  := coalesce(nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''), split_part(_email, '@', 1));
  _phone := nullif(trim(NEW.raw_user_meta_data->>'phone'), '');
  _slug  := case when _biz is null then substr(md5(gen_random_uuid()::text), 1, 12)
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
end; $function$;
