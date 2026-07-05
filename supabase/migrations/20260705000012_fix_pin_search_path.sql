-- 20260705000012_fix_pin_search_path.sql
-- Fix: las funciones de PIN deben resolver crypt()/gen_salt() de pgcrypto (schema extensions).
-- Sin `extensions` en search_path, crypt/gen_salt no se encuentran → PIN roto.

CREATE OR REPLACE FUNCTION public.verify_my_pin(pin text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$ SELECT coalesce(pin_hash = crypt(pin, pin_hash), false) FROM public.profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.set_my_pin(new_pin text)
RETURNS void LANGUAGE sql SECURITY DEFINER
SET search_path = public, extensions
AS $$ UPDATE public.profiles SET pin_hash = crypt(new_pin, gen_salt('bf')) WHERE id = auth.uid() $$;
