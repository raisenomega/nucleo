-- Portal del Cliente P1 — perfil del customer, SEPARADO del staff. NO toca custom_access_token_hook.
-- Identidad del customer = su fila en customer_profiles (user_id = auth.uid()); su tenant sale de aquí.

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text, email text, phone text,
  address text, city text, state text, zip_code text, photo_url text,
  contact_preference text not null default 'email' check (contact_preference in ('email','whatsapp','phone')),
  language text not null default 'es' check (language in ('es','en')),
  notes_for_team text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index if not exists idx_customer_profiles_user on public.customer_profiles(user_id);

alter table public.customer_profiles enable row level security;
-- El customer ve/edita SU propia fila (sin claim de tenant; se ancla por auth.uid()).
create policy cp_select_own on public.customer_profiles for select using (user_id = auth.uid());
create policy cp_update_own on public.customer_profiles for update using (user_id = auth.uid());
-- El staff del tenant lee los perfiles de sus clientes (panel admin). current_tenant() es NULL para customers → sin fuga.
create policy cp_select_staff on public.customer_profiles for select using (tenant_id = current_tenant());

-- Registro del customer: crea/actualiza su perfil bajo el tenant resuelto por hostname. Definer valida tenant,
-- ancla user_id = auth.uid() (no puede crear perfiles ajenos) y bloquea que un staff del tenant se registre como cliente.
create or replace function public.register_customer(p_tenant_id uuid, p_full_name text, p_phone text)
  returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _uid uuid := auth.uid(); _id uuid;
begin
  if _uid is null then raise exception 'No autenticado'; end if;
  if not exists (select 1 from public.tenants where id = p_tenant_id) then raise exception 'Tenant inválido'; end if;
  if exists (select 1 from public.profiles where id = _uid and tenant_id = p_tenant_id) then raise exception 'Este usuario es staff de este negocio'; end if;
  insert into public.customer_profiles (tenant_id, user_id, full_name, email, phone)
    values (p_tenant_id, _uid, nullif(p_full_name,''), auth.email(), nullif(p_phone,''))
    on conflict (tenant_id, user_id) do update set
      full_name = coalesce(nullif(excluded.full_name,''), customer_profiles.full_name),
      phone = coalesce(nullif(excluded.phone,''), customer_profiles.phone), updated_at = now()
    returning id into _id;
  return _id;
end $$;
grant execute on function public.register_customer(uuid, text, text) to authenticated;
comment on table public.customer_profiles is 'Perfil del cliente del Portal (Portal del Cliente, PWA). Separado de profiles (staff). RLS por user_id.';
