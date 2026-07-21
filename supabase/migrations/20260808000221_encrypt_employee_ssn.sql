-- 221 · Ola 1.4 · Cifrado del SSN de empleados (pgcrypto + Vault) + enmascarado.
--
-- BUG (auditoría): employee_details.ssn era TEXTO PLANO (la migr 059 lo admite: "pgcrypto diferido") y la UI
-- mostraba el SSN COMPLETO (el "solo últimos 4" prometido nunca se implementó). Hoy: 0 SSN guardados → riesgo
-- latente, sin fuga real ni backfill.
--
-- DISEÑO: el SSN cifrado vive en una TABLA SEPARADA `employee_ssn`, SIN policies para authenticated → invisible
-- al cliente (el `select *` de employee_details nunca la toca ni expone el bytea). Solo las 3 RPCs SECURITY
-- DEFINER (que bypasean RLS) la leen/escriben. La llave de cifrado vive en Vault (mismo patrón que
-- resend_api_key). pgp_sym_encrypt/decrypt y gen_random_bytes viven en `extensions` → search_path lo incluye
-- (sin esto fallan 42883 en silencio).
--
-- EXPAND/CONTRACT: NO se dropea employee_details.ssn en esta migración. El frontend viejo desplegado aún envía
-- `ssn` en su upsert; dropear la columna rompería el guardado de TODO el personal tab durante el deploy. La
-- columna (vacía) se retira en una migración posterior una vez el nuevo frontend esté 100% desplegado.
--
-- RIESGO DE LA LLAVE: si se pierde `employee_pii_key` del Vault, los SSN cifrados son IRRECUPERABLES — pero
-- recuperables de los I-9/W-4 en papel del empleado. Respaldar la llave del Vault por separado.

-- 1 · Llave de cifrado de PII en Vault (256-bit aleatoria, una sola vez).
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'employee_pii_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'employee_pii_key',
      'Llave de cifrado de PII de empleados (SSN). NO BORRAR: los SSN cifrados quedarian irrecuperables.');
  end if;
end $$;

-- 2 · Tabla separada del SSN cifrado. RLS ON + sin policies → deny-all para authenticated; solo RPCs definer.
create table if not exists public.employee_ssn (
  tenant_id uuid not null references public.tenants(id),
  profile_id uuid not null references public.profiles(id),
  ssn_encrypted bytea not null,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, profile_id));
alter table public.employee_ssn enable row level security;

-- 3 · Escribir/limpiar el SSN (CEO+). Cifra con la llave del Vault. Vacío/null → borra la fila.
create or replace function public.set_employee_ssn(p_profile_id uuid, p_ssn text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare _t uuid := public.current_tenant(); _key text;
begin
  if not public.is_ceo_or_above() then raise exception 'NOT_AUTHORIZED'; end if;
  if not exists (select 1 from public.profiles where id = p_profile_id and tenant_id = _t)
    then raise exception 'EMPLOYEE_NOT_FOUND'; end if;
  if p_ssn is not null and p_ssn <> '' and p_ssn !~ '^\d{3}-\d{2}-\d{4}$'
    then raise exception 'INVALID_SSN_FORMAT'; end if;

  if p_ssn is null or p_ssn = '' then
    delete from public.employee_ssn where tenant_id = _t and profile_id = p_profile_id;
    return jsonb_build_object('status','ok');
  end if;

  select decrypted_secret into _key from vault.decrypted_secrets where name = 'employee_pii_key';
  if _key is null then raise exception 'ENCRYPTION_KEY_MISSING'; end if;

  insert into public.employee_ssn (tenant_id, profile_id, ssn_encrypted, updated_at)
    values (_t, p_profile_id, extensions.pgp_sym_encrypt(p_ssn, _key), now())
  on conflict (tenant_id, profile_id) do update set ssn_encrypted = excluded.ssn_encrypted, updated_at = now();
  return jsonb_build_object('status','ok');
end $$;

-- 4 · Revelar el SSN completo bajo demanda (CEO+) + AUDITA la revelación.
create or replace function public.get_employee_ssn(p_profile_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare _t uuid := public.current_tenant(); _key text; _enc bytea; _ssn text;
begin
  if not public.is_ceo_or_above() then raise exception 'NOT_AUTHORIZED'; end if;
  select ssn_encrypted into _enc from public.employee_ssn where tenant_id = _t and profile_id = p_profile_id;
  if _enc is null then return jsonb_build_object('status','ok','ssn',null); end if;
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'employee_pii_key';
  _ssn := extensions.pgp_sym_decrypt(_enc, _key);
  insert into public.tenant_audit_log (tenant_id, entity_type, entity_id, action, actor, changes)
    values (_t, 'employee_details', p_profile_id, 'reveal_ssn', auth.uid(), jsonb_build_object('at', now()));
  return jsonb_build_object('status','ok','ssn',_ssn);
end $$;

-- 5 · Últimos 4 enmascarados para mostrar por defecto (CEO+, NO audita — no expone el completo).
create or replace function public.get_employee_ssn_last4(p_profile_id uuid)
returns text language plpgsql stable security definer set search_path = public, extensions as $$
declare _t uuid := public.current_tenant(); _key text; _enc bytea;
begin
  if not public.is_ceo_or_above() then raise exception 'NOT_AUTHORIZED'; end if;
  select ssn_encrypted into _enc from public.employee_ssn where tenant_id = _t and profile_id = p_profile_id;
  if _enc is null then return null; end if;
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'employee_pii_key';
  return '•••-••-' || right(extensions.pgp_sym_decrypt(_enc, _key), 4);
end $$;

revoke execute on function public.set_employee_ssn(uuid,text), public.get_employee_ssn(uuid), public.get_employee_ssn_last4(uuid) from public, anon;
grant execute on function public.set_employee_ssn(uuid,text), public.get_employee_ssn(uuid), public.get_employee_ssn_last4(uuid) to authenticated;
