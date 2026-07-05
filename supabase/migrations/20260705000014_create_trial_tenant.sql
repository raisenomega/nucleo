-- 20260705000014_create_trial_tenant.sql
-- Slice #2 Trial: provisión atómica de un tenant en modo trial (3 días).
-- El frontend crea el usuario con supabase.auth.signUp() ANTES de llamar esta función;
-- aquí resolvemos el uid por email desde auth.users y montamos tenant+profile+rol+demo.

create or replace function public.create_trial_tenant(
  name text, email text, business_name text, phone text
) returns jsonb language plpgsql security definer
set search_path = public as $$
declare
  _uid uuid;
  _tenant uuid;
  _slug text := trim(both '-' from lower(regexp_replace(business_name, '[^a-z0-9]+', '-', 'gi')))
                || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
begin
  select u.id into _uid from auth.users u where u.email = create_trial_tenant.email;
  if _uid is null then
    return jsonb_build_object('error', 'auth user no encontrado; signUp primero');
  end if;

  insert into public.tenants (slug, legal_name, status, expires_at)
    values (_slug, business_name, 'trial', now() + interval '3 days')
    returning id into _tenant;

  insert into public.profiles (id, tenant_id, email, full_name, status)
    values (_uid, _tenant, create_trial_tenant.email, name, 'approved');

  insert into public.user_roles (tenant_id, user_id, role)
    values (_tenant, _uid, 'ceo');

  insert into public.categories (tenant_id, kind, label, sort) values
    (_tenant,'income','Ventas',1),(_tenant,'income','Servicios',2),(_tenant,'income','Otros ingresos',3),
    (_tenant,'expense','Nómina',1),(_tenant,'expense','Insumos',2),(_tenant,'expense','Renta',3),
    (_tenant,'payment_method','Efectivo',1),(_tenant,'payment_method','Transferencia',2);

  insert into public.settings (tenant_id, key, value) values
    (_tenant, 'order_prefix', to_jsonb('TR'::text)),
    (_tenant, 'retention_enabled', to_jsonb(false)),
    (_tenant, 'contact_phone', to_jsonb(phone));

  return jsonb_build_object('tenant_id', _tenant);
end; $$;

grant execute on function public.create_trial_tenant(text,text,text,text) to authenticated;
