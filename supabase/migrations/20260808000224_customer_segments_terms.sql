-- 224 · Ola 2.1c · Segmentos de cliente + términos comerciales.
--
-- Capa comercial del maestro: segmentos configurables por tenant (VIP/Mayorista/…) con descuento y términos
-- default, más campos por cliente: segment_id, discount_pct (override del segmento), on_hold + motivo.
--
-- Seguridad: RLS SELECT por tenant (staff). Los clientes de portal viven en customer_profiles, NO en profiles →
-- su current_tenant() es NULL → no ven segmentos. Escritura solo por RPCs SECURITY DEFINER gateadas con
-- can_access_module('customers','edit'/'delete') (helper real). Reusa _assert_customer_in_tenant (migr 223).

create table if not exists public.customer_segments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  description text,
  color text not null default '#6366f1',
  default_discount_pct numeric(5,2) not null default 0,
  default_payment_terms text,
  sort int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name));
create index if not exists idx_customer_segments_tenant on public.customer_segments (tenant_id);

drop trigger if exists set_customer_segments_updated_at on public.customer_segments;
create trigger set_customer_segments_updated_at before update on public.customer_segments for each row execute function public.set_updated_at();

alter table public.customer_segments enable row level security;
drop policy if exists cseg_select on public.customer_segments;
create policy cseg_select on public.customer_segments for select using (tenant_id = public.current_tenant());

alter table public.customer_profiles
  add column if not exists segment_id uuid references public.customer_segments(id) on delete set null,
  add column if not exists discount_pct numeric(5,2) not null default 0,
  add column if not exists on_hold boolean not null default false,
  add column if not exists hold_reason text;

create or replace function public.upsert_customer_segment(_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _t uuid := public.current_tenant(); _id uuid;
begin
  if not public.can_access_module('customers','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  if coalesce(trim(_payload->>'name'),'') = '' then raise exception 'NAME_REQUIRED'; end if;
  if _payload->>'id' is not null then
    update public.customer_segments set name=_payload->>'name', description=_payload->>'description',
      color=coalesce(_payload->>'color','#6366f1'), default_discount_pct=coalesce((_payload->>'default_discount_pct')::numeric,0),
      default_payment_terms=_payload->>'default_payment_terms', sort=coalesce((_payload->>'sort')::int, sort),
      is_active=coalesce((_payload->>'is_active')::boolean, is_active)
    where id=(_payload->>'id')::uuid and tenant_id=_t returning id into _id;
    if _id is null then raise exception 'SEGMENT_NOT_FOUND'; end if;
  else
    insert into public.customer_segments (tenant_id, name, description, color, default_discount_pct, default_payment_terms, sort)
      values (_t, _payload->>'name', _payload->>'description', coalesce(_payload->>'color','#6366f1'),
        coalesce((_payload->>'default_discount_pct')::numeric,0), _payload->>'default_payment_terms', coalesce((_payload->>'sort')::int,0))
      returning id into _id;
  end if;
  return jsonb_build_object('status','ok','id',_id);
end $$;

create or replace function public.delete_customer_segment(_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.can_access_module('customers','delete') then raise exception 'NOT_AUTHORIZED'; end if;
  delete from public.customer_segments where id=_id and tenant_id=public.current_tenant();
  if not found then raise exception 'SEGMENT_NOT_FOUND'; end if;  -- los clientes quedan con segment_id NULL (ON DELETE SET NULL)
  return jsonb_build_object('status','ok');
end $$;

-- Asigna un segmento al cliente. Si _inherit y el segmento tiene defaults: hereda payment_terms; y el descuento
-- SOLO si el cliente no tiene override propio (discount_pct = 0). _segment NULL desasigna.
create or replace function public.assign_segment(_customer uuid, _segment uuid, _inherit boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _t uuid := public.current_tenant(); _seg record;
begin
  if not public.can_access_module('customers','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  perform public._assert_customer_in_tenant(_customer, _t);
  if _segment is not null and not exists (select 1 from public.customer_segments where id=_segment and tenant_id=_t)
    then raise exception 'SEGMENT_NOT_FOUND'; end if;
  update public.customer_profiles set segment_id=_segment, updated_at=now() where id=_customer and tenant_id=_t;
  if _inherit and _segment is not null then
    select default_payment_terms, default_discount_pct into _seg from public.customer_segments where id=_segment;
    update public.customer_profiles set
      payment_terms = coalesce(_seg.default_payment_terms, payment_terms),
      discount_pct = case when coalesce(discount_pct,0) = 0 then _seg.default_discount_pct else discount_pct end
    where id=_customer and tenant_id=_t;
  end if;
  return jsonb_build_object('status','ok');
end $$;

create or replace function public.set_customer_hold(_customer uuid, _on_hold boolean, _reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _t uuid := public.current_tenant();
begin
  if not public.can_access_module('customers','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  perform public._assert_customer_in_tenant(_customer, _t);
  update public.customer_profiles set on_hold=_on_hold, hold_reason=case when _on_hold then _reason else null end, updated_at=now()
    where id=_customer and tenant_id=_t;
  return jsonb_build_object('status','ok');
end $$;

-- Extiende update_customer (misma firma → OR REPLACE, sin ambigüedad PostgREST) para persistir el descuento override.
create or replace function public.update_customer(_customer_id uuid, _payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
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
    notes_for_team = coalesce(_payload->>'notes_for_team', notes_for_team), updated_at = now()
  where id = _customer_id and tenant_id = _t;
  if not found then raise exception 'CUSTOMER_NOT_FOUND'; end if;
  return jsonb_build_object('status','ok');
end $$;

revoke execute on function public.upsert_customer_segment(jsonb), public.delete_customer_segment(uuid), public.assign_segment(uuid, uuid, boolean), public.set_customer_hold(uuid, boolean, text) from public, anon;
grant execute on function public.upsert_customer_segment(jsonb), public.delete_customer_segment(uuid), public.assign_segment(uuid, uuid, boolean), public.set_customer_hold(uuid, boolean, text) to authenticated;
