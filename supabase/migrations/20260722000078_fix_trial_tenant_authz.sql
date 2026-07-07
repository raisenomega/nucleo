-- 20260722000078_fix_trial_tenant_authz.sql
-- SEGURIDAD (crítico): create_trial_tenant resolvía el uid por el EMAIL del parámetro, sin validar
-- que fuese el del llamante -> permitía provisión en nombre de terceros y creación masiva de tenants.
-- Fix: el usuario SIEMPRE es auth.uid(); el email se lee de auth.users por ese uid (nunca del arg).
-- Guard: un solo tenant por usuario (si ya tiene profile, se rechaza). Firma intacta (no rompe el front).
-- Depende de que Supabase tenga autoconfirm ON (el front llama al RPC justo tras signUp, con sesión).

create or replace function public.create_trial_tenant(
  name text, email text, business_name text, phone text
) returns jsonb language plpgsql security definer
set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _email text;
  _tenant uuid;
  _slug text;
begin
  if _uid is null then
    return jsonb_build_object('error', 'no autenticado');
  end if;

  -- Email SIEMPRE del JWT/auth.users por el uid del llamante. El parámetro 'email' se ignora
  -- a propósito (se conserva en la firma solo para no romper la llamada existente del front).
  select u.email into _email from auth.users u where u.id = _uid;
  if _email is null then
    return jsonb_build_object('error', 'usuario no encontrado');
  end if;

  -- Un trial por usuario: si ya pertenece a un tenant, no se provisiona otro.
  if exists (select 1 from public.profiles where id = _uid) then
    return jsonb_build_object('error', 'el usuario ya pertenece a un tenant');
  end if;

  _slug := trim(both '-' from lower(regexp_replace(business_name, '[^a-z0-9]+', '-', 'gi')))
           || '-' || substr(md5(gen_random_uuid()::text), 1, 6);

  insert into public.tenants (slug, legal_name, status, expires_at)
    values (_slug, business_name, 'trial', now() + interval '3 days')
    returning id into _tenant;

  insert into public.profiles (id, tenant_id, email, full_name, status)
    values (_uid, _tenant, _email, name, 'approved');

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
