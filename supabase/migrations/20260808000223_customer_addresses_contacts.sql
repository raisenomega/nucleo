-- 223 · Ola 2.1b · Direcciones y contactos múltiples por cliente.
--
-- Un cliente ERP tiene varias direcciones (facturación ≠ envío ≠ servicio) y varios contactos (quien compra ≠
-- quien paga). Dos tablas satélite de customer_profiles (CASCADE al borrar el cliente).
--
-- RLS segura sin leak al portal: el auth hook pone tenant_id al JWT SOLO para usuarios en `profiles` (staff);
-- los clientes de portal viven en customer_profiles y NO están en profiles → su current_tenant() es NULL → la
-- policy `tenant_id = current_tenant()` no les muestra nada. El staff ve las de su tenant. Escritura solo por
-- RPCs SECURITY DEFINER gateadas con can_access_module('customers',...) (el helper real de la Rodaja 1;
-- can_manage_customers NO existe).

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  customer_id uuid not null references public.customer_profiles(id) on delete cascade,
  address_type text not null default 'billing' check (address_type in ('billing','shipping','service','other')),
  label text, line1 text not null, line2 text, city text, state text, postal_code text,
  country text not null default 'US', is_default boolean not null default false, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_customer_addresses_customer on public.customer_addresses (customer_id);

create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  customer_id uuid not null references public.customer_profiles(id) on delete cascade,
  name text not null, role text, email text, phone text,
  is_primary boolean not null default false, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_customer_contacts_customer on public.customer_contacts (customer_id);

drop trigger if exists set_customer_addresses_updated_at on public.customer_addresses;
create trigger set_customer_addresses_updated_at before update on public.customer_addresses for each row execute function public.set_updated_at();
drop trigger if exists set_customer_contacts_updated_at on public.customer_contacts;
create trigger set_customer_contacts_updated_at before update on public.customer_contacts for each row execute function public.set_updated_at();

alter table public.customer_addresses enable row level security;
drop policy if exists caddr_select on public.customer_addresses;
create policy caddr_select on public.customer_addresses for select using (tenant_id = public.current_tenant());
alter table public.customer_contacts enable row level security;
drop policy if exists ccont_select on public.customer_contacts;
create policy ccont_select on public.customer_contacts for select using (tenant_id = public.current_tenant());

-- Verifica que el cliente pertenece al tenant del actor (aísla cross-tenant).
create or replace function public._assert_customer_in_tenant(_customer uuid, _tenant uuid)
returns void language plpgsql as $$
begin
  if not exists (select 1 from public.customer_profiles where id = _customer and tenant_id = _tenant)
    then raise exception 'CUSTOMER_NOT_FOUND'; end if;
end $$;

create or replace function public.upsert_customer_address(_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _t uuid := public.current_tenant(); _id uuid; _cust uuid := (_payload->>'customer_id')::uuid; _type text := coalesce(_payload->>'address_type','billing');
begin
  if not public.can_access_module('customers','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  perform public._assert_customer_in_tenant(_cust, _t);
  if coalesce(trim(_payload->>'line1'),'') = '' then raise exception 'LINE1_REQUIRED'; end if;
  if _payload->>'id' is not null then
    update public.customer_addresses set address_type=_type, label=_payload->>'label', line1=_payload->>'line1',
      line2=_payload->>'line2', city=_payload->>'city', state=_payload->>'state', postal_code=_payload->>'postal_code',
      country=coalesce(_payload->>'country','US'), notes=_payload->>'notes'
    where id=(_payload->>'id')::uuid and tenant_id=_t returning id into _id;
    if _id is null then raise exception 'ADDRESS_NOT_FOUND'; end if;
  else
    insert into public.customer_addresses (tenant_id, customer_id, address_type, label, line1, line2, city, state, postal_code, country, notes)
      values (_t, _cust, _type, _payload->>'label', _payload->>'line1', _payload->>'line2', _payload->>'city', _payload->>'state', _payload->>'postal_code', coalesce(_payload->>'country','US'), _payload->>'notes')
      returning id into _id;
  end if;
  if (_payload->>'is_default')::boolean then  -- default EXCLUSIVO por tipo
    update public.customer_addresses set is_default = (id = _id) where customer_id = _cust and address_type = _type;
  end if;
  return jsonb_build_object('status','ok','id',_id);
end $$;

create or replace function public.upsert_customer_contact(_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _t uuid := public.current_tenant(); _id uuid; _cust uuid := (_payload->>'customer_id')::uuid;
begin
  if not public.can_access_module('customers','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  perform public._assert_customer_in_tenant(_cust, _t);
  if coalesce(trim(_payload->>'name'),'') = '' then raise exception 'NAME_REQUIRED'; end if;
  if _payload->>'id' is not null then
    update public.customer_contacts set name=_payload->>'name', role=_payload->>'role', email=_payload->>'email',
      phone=_payload->>'phone', notes=_payload->>'notes' where id=(_payload->>'id')::uuid and tenant_id=_t returning id into _id;
    if _id is null then raise exception 'CONTACT_NOT_FOUND'; end if;
  else
    insert into public.customer_contacts (tenant_id, customer_id, name, role, email, phone, notes)
      values (_t, _cust, _payload->>'name', _payload->>'role', _payload->>'email', _payload->>'phone', _payload->>'notes')
      returning id into _id;
  end if;
  if (_payload->>'is_primary')::boolean then  -- primary EXCLUSIVO por cliente
    update public.customer_contacts set is_primary = (id = _id) where customer_id = _cust;
  end if;
  return jsonb_build_object('status','ok','id',_id);
end $$;

create or replace function public.delete_customer_address(_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.can_access_module('customers','delete') then raise exception 'NOT_AUTHORIZED'; end if;
  delete from public.customer_addresses where id=_id and tenant_id=public.current_tenant();
  if not found then raise exception 'ADDRESS_NOT_FOUND'; end if;
  return jsonb_build_object('status','ok');
end $$;

create or replace function public.delete_customer_contact(_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.can_access_module('customers','delete') then raise exception 'NOT_AUTHORIZED'; end if;
  delete from public.customer_contacts where id=_id and tenant_id=public.current_tenant();
  if not found then raise exception 'CONTACT_NOT_FOUND'; end if;
  return jsonb_build_object('status','ok');
end $$;

revoke execute on function public.upsert_customer_address(jsonb), public.upsert_customer_contact(jsonb), public.delete_customer_address(uuid), public.delete_customer_contact(uuid) from public, anon;
grant execute on function public.upsert_customer_address(jsonb), public.upsert_customer_contact(jsonb), public.delete_customer_address(uuid), public.delete_customer_contact(uuid) to authenticated;
