-- v2a.5 · Infraestructura de contratos firmables. NADA se enciende aquí: los planes siguen deshabilitados
-- y el placeholder PENDIENTE_v2b intacto. v2a.6 conecta el flujo end-to-end.
--
-- Por qué una tabla dedicada y no audit_log: la migr 310 línea 143 purga audit_log al año, y hoy la ÚNICA
-- evidencia de firma (terms_hash + IP + accepted_at) vive ahí. Un contrato de 12-24 meses perdería su
-- prueba antes de vencer. Aquí la retención es indefinida y el texto va congelado en la fila.

-- ---------------------------------------------------------------------------------------------------
-- 1) tenant_order_counters gana `kind`. No se usa CASCADE al soltar la PK: se verificó que NINGUNA FK
--    referencia esta tabla (pg_constraint confrelid → 0 filas), así que CASCADE sólo añadiría riesgo.
--    Las 2 filas vivas heredan kind='order' por el DEFAULT.
-- ---------------------------------------------------------------------------------------------------
alter table public.tenant_order_counters add column if not exists kind text not null default 'order';
alter table public.tenant_order_counters drop constraint if exists tenant_order_counters_pkey;
alter table public.tenant_order_counters add primary key (tenant_id, kind);

-- ---------------------------------------------------------------------------------------------------
-- 2) next_order_number acepta kind. Se SUELTA la versión de 1 argumento en vez de dejarla conviviendo:
--    con las dos, una llamada `next_order_number(_t)` seguiría resolviendo a la vieja (coincidencia
--    exacta gana sobre el DEFAULT) y el kind no se aplicaría nunca — un fallo silencioso.
--    Con el DEFAULT, los 6 llamadores existentes y los triggers de invoice/quote siguen igual.
--    Nota: la serie de contratos es correlativa por tenant, con el año como etiqueta (no reinicia en
--    enero); así CONT-2026-0007 y CONT-2027-0008 nunca colisionan ni dejan huecos ambiguos.
-- ---------------------------------------------------------------------------------------------------
drop function if exists public.next_order_number(uuid);

create function public.next_order_number(_tenant uuid, _kind text default 'order')
returns text language plpgsql set search_path to 'public' as $$
declare _n bigint; _prefix text;
begin
  insert into public.tenant_order_counters (tenant_id, kind, next_val)
    values (_tenant, _kind, 0) on conflict (tenant_id, kind) do nothing;
  update public.tenant_order_counters set next_val = next_val + 1
    where tenant_id = _tenant and kind = _kind returning next_val - 1 into _n;
  if _n is null then raise exception 'no se pudo generar número (% / %)', _tenant, _kind; end if;
  if _kind = 'contract' then
    return 'CONT-' || to_char(now(), 'YYYY') || '-' || lpad((_n + 1)::text, 4, '0');
  end if;
  select value->>0 from public.settings where tenant_id = _tenant and key = 'order_prefix' into _prefix;
  return '#' || coalesce(_prefix,'') || _n::text;
end $$;

-- ---------------------------------------------------------------------------------------------------
-- 3) La tabla. terms_snapshot va INLINE (no FK a una tabla de versiones): el punto entero es que la
--    evidencia sea autocontenida y nadie pueda borrar la fila a la que apunta. Sólo se guarda el idioma
--    FIRMADO — guardar los dos dejaría ambiguo cuál obliga.
-- ---------------------------------------------------------------------------------------------------
create table if not exists public.tenant_signed_contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contract_number text not null,
  order_id uuid not null references public.tenant_landing_orders(id) on delete restrict,
  form_id uuid references public.tenant_order_forms(id) on delete set null,
  locale text not null check (locale in ('es','en')),
  terms_snapshot text not null,
  terms_summary_snapshot text,
  terms_hash text not null,
  signed_at timestamptz not null default now(),
  signer_name text not null,
  signer_email text not null,
  ip_address text,
  user_agent text,
  token_hash text not null,
  expires_at timestamptz,          -- null = sin caducidad (decisión del owner)
  revoked_at timestamptz,          -- ... pero revocable
  pdf_path text,
  created_at timestamptz not null default now(),
  unique (tenant_id, contract_number)
);
create index if not exists idx_signed_contracts_tenant on public.tenant_signed_contracts (tenant_id, signed_at desc);
create index if not exists idx_signed_contracts_order on public.tenant_signed_contracts (order_id);
create index if not exists idx_signed_contracts_token on public.tenant_signed_contracts (token_hash) where revoked_at is null;

alter table public.tenant_signed_contracts enable row level security;
drop policy if exists tsc_tenant on public.tenant_signed_contracts;
create policy tsc_tenant on public.tenant_signed_contracts
  for all using (tenant_id = public.current_tenant()) with check (tenant_id = public.current_tenant());

-- ---------------------------------------------------------------------------------------------------
-- 4) Capa 1 del contrato. La tabla es tenant_order_forms (NO existe ninguna tenant_landing_forms).
--    terms_es/terms_en de la migr 348 se reusan tal cual como Capa 2 (contrato completo): renombrarlas
--    rompería el repositorio y el mapper ya desplegados, y su contenido es el placeholder.
-- ---------------------------------------------------------------------------------------------------
alter table public.tenant_order_forms
  add column if not exists terms_summary_es text,
  add column if not exists terms_summary_en text;

-- ---------------------------------------------------------------------------------------------------
-- 5) Token: molde fuerte (el de create_quote_approval_token), no el uuid en claro de las otras rutas.
--    24 bytes = 192 bits; se persiste SÓLO el sha256. El claro se devuelve una vez y no se guarda nunca.
-- ---------------------------------------------------------------------------------------------------
create or replace function public.create_contract_token(out token text, out token_hash text)
language plpgsql security definer set search_path to 'public','extensions' as $$
begin
  token := encode(gen_random_bytes(24), 'hex');
  token_hash := encode(digest(token, 'sha256'), 'hex');
end $$;
revoke execute on function public.create_contract_token() from public, anon;

-- Emisión de un contrato firmado. Interna (la llamará v2a.6 desde el flujo de aceptación); aquí queda
-- disponible para poder probar la infra sin encender nada.
create or replace function public._issue_signed_contract(
  _order_id uuid, _locale text, _terms text, _summary text,
  _signer_name text, _signer_email text, _ip text, _ua text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $$
declare _o record; _num text; _tok record; _id uuid;
begin
  select id, tenant_id, form_id into _o from public.tenant_landing_orders where id = _order_id;
  if _o.id is null then return jsonb_build_object('status','error','code','order_not_found'); end if;
  if coalesce(_terms,'') = '' or _terms ~ '^(PENDIENTE_|PENDING_)' then
    return jsonb_build_object('status','error','code','terms_placeholder'); end if;
  select * into _tok from public.create_contract_token();
  _num := public.next_order_number(_o.tenant_id, 'contract');
  insert into public.tenant_signed_contracts (tenant_id, contract_number, order_id, form_id, locale,
    terms_snapshot, terms_summary_snapshot, terms_hash, signer_name, signer_email, ip_address, user_agent, token_hash)
  values (_o.tenant_id, _num, _o.id, _o.form_id, case when _locale='en' then 'en' else 'es' end,
    _terms, _summary, encode(digest(_terms,'sha256'),'hex'), _signer_name, _signer_email, _ip, _ua, _tok.token_hash)
  returning id into _id;
  return jsonb_build_object('status','ok','contract_id',_id,'contract_number',_num,'token',_tok.token);
end $$;
revoke execute on function public._issue_signed_contract(uuid,text,text,text,text,text,text,text) from public, anon;

-- ---------------------------------------------------------------------------------------------------
-- 6) Lectura pública por token. Molde de get_public_invoice. GRANT explícito obligatorio: tras la migr
--    349 el default privilege ya no otorga nada a anon.
--    Columnas reales verificadas: tenants NO tiene `name` (es display_name/legal_name) y tenant_themes
--    NO tiene `brand_color_hex` (es primary_color/accent_color).
-- ---------------------------------------------------------------------------------------------------
create or replace function public.get_public_contract(p_token text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $$
declare _row public.tenant_signed_contracts%rowtype; _b record;
begin
  if public._public_rate_hit(coalesce(p_token,'')) > 30 then
    return jsonb_build_object('error','rate_limited'); end if;
  select * into _row from public.tenant_signed_contracts
   where token_hash = encode(digest(coalesce(p_token,''), 'sha256'), 'hex')
     and revoked_at is null and (expires_at is null or expires_at > now());
  if _row.id is null then return jsonb_build_object('error','not_found'); end if;
  select coalesce(nullif(trim(t.display_name),''), t.legal_name) as tenant_name,
         th.primary_color, th.accent_color, th.logo_url
    into _b
    from public.tenants t left join public.tenant_themes th on th.tenant_id = t.id
   where t.id = _row.tenant_id;
  return jsonb_build_object(
    'contract_number', _row.contract_number, 'signed_at', _row.signed_at,
    'signer_name', _row.signer_name, 'signer_email', _row.signer_email,
    'locale', _row.locale, 'terms', _row.terms_snapshot, 'terms_summary', _row.terms_summary_snapshot,
    'terms_hash', _row.terms_hash, 'ip_address', _row.ip_address,
    'tenant_name', _b.tenant_name, 'primary_color', _b.primary_color,
    'accent_color', _b.accent_color, 'logo_url', _b.logo_url);
end $$;
grant execute on function public.get_public_contract(text) to anon, authenticated;
