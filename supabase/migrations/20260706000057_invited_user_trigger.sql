-- 20260706000057_invited_user_trigger.sql
-- Auto-registro del empleado invitado: al crear su auth.users, si el email está en allowed_emails
-- de algún tenant → crea profile (approved) + asigna el rol definido por el CEO. El trial no se toca
-- (los trials no están en allowed_emails → el trigger no hace nada y create_trial_tenant sigue igual).

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  _email text := lower(NEW.email);        -- FIX: el email viene en NEW.email, no en raw_user_meta_data
  _allowed public.allowed_emails%rowtype;
begin
  select * into _allowed from public.allowed_emails where lower(email) = _email limit 1;
  if found then                            -- FIX: 'found', no '_allowed IS NOT NULL' (poco fiable en record)
    insert into public.profiles (id, tenant_id, email, full_name, status, approved_at)
    values (NEW.id, _allowed.tenant_id, _email, _allowed.full_name, 'approved', now())
    on conflict (id) do nothing;
    insert into public.user_roles (tenant_id, user_id, role)
    values (_allowed.tenant_id, NEW.id, _allowed.role)
    on conflict (tenant_id, user_id, role) do nothing;
  end if;
  return NEW;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
