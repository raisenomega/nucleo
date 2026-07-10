-- P2.A — Página pública /aprobar/{token}: 2 RPCs _public (anon) + rate limit + columnas.
-- Token hash-only (122); estas RPCs son el único acceso anónimo, gateadas por el token (192 bits)
-- + throttle best-effort por IP. convert_quote_to_invoice corre vía impersonación de claims del CEO.

-- 1) Columnas nuevas.
alter table public.tenants          add column if not exists contact_phone text;
alter table public.quotes           add column if not exists pdf_url text;
alter table public.quotes           add column if not exists pdf_url_expires_at timestamptz;
alter table public.quote_approvals  add column if not exists client_response_note text;

-- 2) Rate limit (best-effort, ttl 24h). Keyed por hash(token_hash|ip), ventana 5 min.
create table if not exists public.rate_limit_public (
  bucket_key   text primary key,
  count        int not null default 1,
  window_start timestamptz not null default now()
);
create index if not exists idx_rate_limit_purge on public.rate_limit_public(window_start);

-- 3) Helper: incrementa el bucket (token_hash + x-forwarded-for) y devuelve el count de la ventana.
create or replace function public._public_rate_hit(_token_hash text)
returns int language plpgsql security definer set search_path = public, extensions as $fn$
declare _ip text; _bucket text; _cnt int;
begin
  _ip := coalesce(nullif(current_setting('request.headers', true),'')::json->>'x-forwarded-for','unknown');
  -- Ventana FIJA de 5 min codificada en la llave (D-P2A-6: 30 por IP+token en 5 min).
  _bucket := encode(digest(_token_hash || '|' || _ip || '|'
    || (floor(extract(epoch from now())/300)*300)::text, 'sha256'),'hex');
  delete from public.rate_limit_public where window_start < now() - interval '24 hours';
  insert into public.rate_limit_public(bucket_key, count, window_start) values (_bucket, 1, now())
  on conflict (bucket_key) do update set count = rate_limit_public.count + 1
  returning count into _cnt;
  return _cnt;
end $fn$;

-- 4) Lectura pública de la cotización por token.
create or replace function public._public_get_quote_by_token(_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $fn$
declare _hash text; _a record; _q record; _cid uuid := gen_random_uuid();
begin
  _hash := encode(digest(_token,'sha256'),'hex');
  if public._public_rate_hit(_hash) > 30 then return jsonb_build_object('status','rate_limited'); end if;

  select * into _a from public.quote_approvals where token_hash = _hash;
  if not found then return jsonb_build_object('status','not_found'); end if;

  select q.*, t.display_name, t.legal_name, t.contact_phone,
         th.primary_color, th.accent_color, th.logo_url
    into _q from public.quotes q
    join public.tenants t on t.id = q.tenant_id
    left join public.tenant_themes th on th.tenant_id = q.tenant_id
    where q.id = _a.quote_id;

  if _a.expires_at <= now() then
    return jsonb_build_object('status','expired','tenant_display_name',_q.display_name,'tenant_contact_phone',_q.contact_phone);
  end if;
  if _a.responded_at is not null then
    return jsonb_build_object('status','used','responded_at',_a.responded_at,
      'tenant_display_name',_q.display_name,'tenant_contact_phone',_q.contact_phone);
  end if;

  return jsonb_build_object(
    'status','valid',
    'quote', jsonb_build_object(
      'quote_number',_q.quote_number,'client_name',_q.client_name,'client_email',_q.client_email,
      'client_phone',_q.client_phone,'client_address',_q.client_address,'items',_q.items,
      'subtotal',_q.subtotal,'tax_total',_q.tax_total,'total',_q.total,
      'notes',_q.notes,'terms',_q.terms,'valid_until',_q.valid_until),
    'tenant', jsonb_build_object(
      'display_name',_q.display_name,'legal_name',_q.legal_name,'contact_phone',_q.contact_phone,
      'primary_color',coalesce(_q.primary_color,'#1a1a2e'),'accent_color',coalesce(_q.accent_color,'#4a4a6a'),
      'logo_url',_q.logo_url),
    'pdf_url',_q.pdf_url,'pdf_url_expires_at',_q.pdf_url_expires_at);
exception when others then
  raise warning '_public_get_quote_by_token [%] sqlstate=% msg=%', _cid, sqlstate, sqlerrm;
  return jsonb_build_object('status','error');
end $fn$;

-- 5) Respuesta del cliente (aceptar/rechazar). Terminal. Impersona al CEO para auto-facturar.
create or replace function public._public_quote_respond(_token text, _decision text, _note text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $fn$
declare _hash text; _a record; _q record; _prev text; _cid uuid := gen_random_uuid();
begin
  _prev := current_setting('request.jwt.claims', true);   -- para restaurar tras impersonar
  if _decision not in ('accepted','rejected') then return jsonb_build_object('status','bad_decision'); end if;
  _hash := encode(digest(_token,'sha256'),'hex');
  if public._public_rate_hit(_hash) > 30 then return jsonb_build_object('status','rate_limited'); end if;

  select * into _a from public.quote_approvals where token_hash = _hash;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if _a.expires_at <= now() then return jsonb_build_object('status','expired'); end if;
  if _a.responded_at is not null then return jsonb_build_object('status','already_responded'); end if;

  select q.id, q.tenant_id, q.created_by, t.display_name, t.contact_phone
    into _q from public.quotes q join public.tenants t on t.id = q.tenant_id where q.id = _a.quote_id;

  update public.quote_approvals
     set response = _decision, responded_at = now(),
         client_response_note = nullif(trim(coalesce(_note,'')),'')
   where id = _a.id;

  -- Impersona al CEO del tenant (token ya validado) para que convert_quote_to_invoice pase sus guards.
  perform set_config('request.jwt.claims',
    (jsonb_build_object('user_role','ceo','tenant_id',_q.tenant_id::text)
     || case when _q.created_by is not null then jsonb_build_object('sub',_q.created_by::text) else '{}'::jsonb end
    )::text, true);

  if _decision = 'accepted' then
    update public.quotes set status = 'accepted', responded_at = now() where id = _q.id;
    perform public.convert_quote_to_invoice(_q.id);   -- deja quote en 'converted' + factura draft
  else
    update public.quotes set status = 'rejected', responded_at = now() where id = _q.id;
  end if;

  perform set_config('request.jwt.claims', coalesce(_prev,'{}'), true);   -- restaura claims (JSON válido)
  return jsonb_build_object('status','ok','decision',_decision,
    'tenant_display_name',_q.display_name,'tenant_contact_phone',_q.contact_phone);
exception when others then
  perform set_config('request.jwt.claims', coalesce(_prev,'{}'), true);
  raise warning '_public_quote_respond [%] sqlstate=% msg=% token_hash=%', _cid, sqlstate, sqlerrm, _hash;
  return jsonb_build_object('status','error');
end $fn$;

-- 6) Grants: solo las 2 RPCs públicas a anon; el helper queda interno.
-- anon = cliente sin sesión; authenticated = owner que abre el link ya logueado. El token es el gate real.
grant execute on function public._public_get_quote_by_token(text) to anon, authenticated;
grant execute on function public._public_quote_respond(text, text, text) to anon, authenticated;
revoke execute on function public._public_rate_hit(text) from public, anon, authenticated;
