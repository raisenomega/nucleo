-- 20260802000110_trial_7_days.sql
-- Trial de 7 días (antes 3). Idéntica a migr 101 salvo el intervalo de expires_at.

create or replace function public.create_trial_tenant(
  name text, email text, business_name text, phone text
) returns jsonb language plpgsql security definer
set search_path = public as $$
declare
  _uid uuid := auth.uid(); _email text; _tenant uuid; _slug text;
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

  insert into public.categories (tenant_id, kind, label, sort) values
    (_tenant,'income','Ventas',1),(_tenant,'income','Servicios',2),(_tenant,'income','Otros ingresos',3),
    (_tenant,'expense','Nómina',1),(_tenant,'expense','Insumos',2),(_tenant,'expense','Renta',3),
    (_tenant,'payment_method','Efectivo',1),(_tenant,'payment_method','Transferencia',2),
    (_tenant,'support_category','IT',1),(_tenant,'support_category','RRHH',2),(_tenant,'support_category','Operaciones',3),
    (_tenant,'support_category','Instalaciones',4),(_tenant,'support_category','Otro',5);

  insert into public.settings (tenant_id, key, value) values
    (_tenant, 'order_prefix', to_jsonb('TR'::text)),
    (_tenant, 'retention_enabled', to_jsonb(false)),
    (_tenant, 'contact_phone', to_jsonb(phone));

  return jsonb_build_object('tenant_id', _tenant);
end; $$;

grant execute on function public.create_trial_tenant(text,text,text,text) to authenticated;
