-- 20260707000058_profile_phone_pin.sql
-- Perfil de empleado: campo phone + RPC para que un admin (ceo+) asigne el PIN de OTRO usuario.
-- (set_my_pin solo opera sobre el propio auth.uid(); esto lo hace un ceo+ para el user del tenant.)

alter table public.profiles add column phone text;

create or replace function public.admin_set_pin(p_user_id uuid, p_pin text)
returns void language sql security definer set search_path = public, extensions as $$
  update public.profiles set pin_hash = crypt(p_pin, gen_salt('bf'))
  where id = p_user_id and tenant_id = public.current_tenant() and public.is_ceo_or_above();
$$;
grant execute on function public.admin_set_pin(uuid, text) to authenticated;
