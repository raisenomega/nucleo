-- P1.B — Envío de cotización + token de aprobación.
-- + quotes.sent_channels, + quote_approvals (token HASHEADO),
-- + RPC create_quote_approval_token (auth + rate-limit 20/10min + correlation-id + exception handler),
-- + _quote_email_html (puro, testeable), + _notify_quote_sent (Resend, email SOLO approval_url),
-- + RPC send_quote. Sin trigger (C3): send_quote invoca _notify_quote_sent inline via perform.

-- 1) Canal(es) del último envío.
alter table public.quotes add column if not exists sent_channels text[] not null default '{}';

-- 2) Tabla de tokens (solo hash).
create table if not exists public.quote_approvals (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references public.quotes(id)  on delete cascade,
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  token_hash   text not null,
  expires_at   timestamptz not null,
  response     text check (response in ('accepted','rejected')),
  responded_at timestamptz,
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now()
);
create unique index if not exists quote_approvals_token_hash_uidx on public.quote_approvals(token_hash);
create index        if not exists quote_approvals_quote_idx       on public.quote_approvals(quote_id);

alter table public.quote_approvals enable row level security;

-- 3) RLS (PB4): SELECT/UPDATE authenticated si operaciones+ o dueño. Sin INSERT/DELETE.
drop policy if exists quote_approvals_select on public.quote_approvals;
create policy quote_approvals_select on public.quote_approvals for select to authenticated
  using (tenant_id = current_tenant()
         and (public.is_operaciones_or_above() or created_by = auth.uid()));

drop policy if exists quote_approvals_update on public.quote_approvals;
create policy quote_approvals_update on public.quote_approvals for update to authenticated
  using (tenant_id = current_tenant()
         and (public.is_operaciones_or_above() or created_by = auth.uid()))
  with check (tenant_id = current_tenant());

-- 4) RPC acuña token — FIX 1: auth + rate-limit (20/10min) + correlation-id + exception handler.
create or replace function public.create_quote_approval_token(p_quote_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  _cid uuid := gen_random_uuid();
  _tenant uuid := current_tenant();
  _q record; _rl int; _token text; _expires_at timestamptz; _site text;
begin
  if not public.can_access_module('quotes','edit') then raise exception 'No autorizado'; end if;

  select id, tenant_id, status into _q
    from public.quotes where id = p_quote_id and tenant_id = _tenant;
  if not found then raise exception 'quote no encontrada o fuera de tenant'; end if;
  if _q.status not in ('draft','sent','viewed') then
    raise exception 'estado % no admite envío', _q.status; end if;

  -- Rate limit: máx 20 tokens / 10 minutos por tenant.
  select count(*) into _rl from public.quote_approvals
   where tenant_id = _tenant and created_at > now() - interval '10 minutes';
  if _rl >= 20 then
    raise warning 'create_quote_approval_token [%] rate_limited tenant=% count=%', _cid, _tenant, _rl;
    return jsonb_build_object('error','rate_limited');
  end if;

  -- PB5: reenvío invalida tokens vivos previos de esta cotización.
  update public.quote_approvals set expires_at = now()
   where quote_id = p_quote_id and response is null and expires_at > now();

  _token := encode(extensions.gen_random_bytes(24), 'hex');
  _expires_at := now() + interval '30 days';
  insert into public.quote_approvals(quote_id, tenant_id, token_hash, expires_at, created_by)
  values (p_quote_id, _tenant, encode(extensions.digest(_token,'sha256'),'hex'), _expires_at, auth.uid());

  select coalesce(nullif(trim(t.primary_domain),''), 'https://nucleo-blush.vercel.app')
    into _site from public.tenants t where t.id = _tenant;

  return jsonb_build_object(
    'token_plain', _token,
    'approval_url', _site || '/aprobar/' || _token,
    'expires_at', _expires_at);
exception when others then
  raise warning 'create_quote_approval_token [%] EXCEPTION: sqlstate=% msg=% quote=%',
    _cid, sqlstate, sqlerrm, p_quote_id;
  raise;
end $fn$;

-- 5a) Helper PURO: arma el HTML del email (sin http → testeable). FIX 3: solo approval_url.
create or replace function public._quote_email_html(
  p_quote_id uuid, p_token_plain text, p_message text)
returns text language plpgsql security definer set search_path = public as $fn$
declare _q record; _name text; _site text; _approval text;
begin
  select q.quote_number, q.tenant_id into _q from public.quotes q where q.id = p_quote_id;
  select coalesce(nullif(trim(t.display_name),''), t.legal_name, 'NÚCLEO'),
         coalesce(nullif(trim(t.primary_domain),''), 'https://nucleo-blush.vercel.app')
    into _name, _site from public.tenants t where t.id = _q.tenant_id;
  _approval := _site || '/aprobar/' || p_token_plain;

  return '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">'
    || '<h2 style="color:#111827">' || _html_escape(_name) || '</h2>'
    || case when coalesce(trim(p_message),'') <> '' then
         '<p style="font-size:15px">' || _html_escape(p_message) || '</p>' else '' end
    || '<p style="font-size:15px">Te compartimos tu cotización <strong>'
    || _html_escape(coalesce(_q.quote_number,'')) || '</strong>.</p>'
    || '<p style="text-align:center;margin:28px 0">'
    || '<a href="' || _html_escape(_approval) || '" style="background:#16a34a;color:#fff;'
    || 'text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block">'
    || 'Ver y responder cotización</a></p>'
    || '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">'
    || '<p style="font-size:12px;color:#9ca3af">Enviado por ' || _html_escape(_name) || '.</p></div>';
end $fn$;

-- 5b) Envía el email (Resend, patrón 113). FIX 2: early-return si falta email. FIX 3: sin pdf_url.
create or replace function public._notify_quote_sent(
  p_quote_id uuid, p_token_plain text, p_message text)
returns void language plpgsql security definer set search_path = public as $fn$
declare _q record; _name text; _key text; _subject text; _html text;
        _status int; _resp text; _cid uuid := gen_random_uuid(); _tenant uuid := current_tenant();
begin
  select q.client_name, q.client_email, q.quote_number, q.tenant_id into _q
    from public.quotes q where q.id = p_quote_id and q.tenant_id = _tenant;

  -- FIX 2: sin email cliente → no intentar envío (el path WhatsApp queda independiente).
  if _q.client_email is null or _q.client_email = '' then
    raise warning '_notify_quote_sent [%] falta email cliente quote=% tenant=%', _cid, p_quote_id, _tenant;
    return;
  end if;

  select coalesce(nullif(trim(t.display_name),''), t.legal_name, 'NÚCLEO')
    into _name from public.tenants t where t.id = _q.tenant_id;
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then
    raise warning '_notify_quote_sent [%] falta resend_api_key; email no enviado quote=%', _cid, p_quote_id;
    return; end if;

  _subject := _name || ' — Cotización ' || coalesce(_q.quote_number,'');
  _html := public._quote_email_html(p_quote_id, p_token_plain, p_message);

  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','5000');
  select status, content into _status, _resp
    from http(('POST','https://api.resend.com/emails',
      array[http_header('Authorization','Bearer '||_key)], 'application/json',
      jsonb_build_object('from', _name || ' <noreply@raisen.agency>',
        'to', _q.client_email, 'subject', _subject, 'html', _html)::text)::http_request);
  if _status is null or _status < 200 or _status >= 300 then
    raise warning '_notify_quote_sent [%] Resend no-2xx status=% body=% quote=%', _cid, _status, _resp, p_quote_id;
  end if;
exception when others then
  raise warning '_notify_quote_sent [%] EXCEPTION sqlstate=% msg=% quote=%', _cid, sqlstate, sqlerrm, p_quote_id;
end $fn$;

-- 6) RPC final del frontend: marca enviada (atómica) + dispara email si aplica.
create or replace function public.send_quote(
  p_quote_id uuid, p_channels text[], p_token_plain text, p_message text)
returns void language plpgsql security definer set search_path = public as $fn$
declare _q record; _cid uuid := gen_random_uuid();
begin
  if not public.can_access_module('quotes','edit') then raise exception 'No autorizado'; end if;

  select id, status into _q
    from public.quotes where id = p_quote_id and tenant_id = current_tenant();
  if not found then raise exception 'quote no encontrada o fuera de tenant'; end if;
  if _q.status not in ('draft','sent','viewed') then
    raise exception 'estado % no admite envío', _q.status; end if;
  if array_length(p_channels,1) is null then raise exception 'sin canales'; end if;

  update public.quotes
     set status        = case when status = 'draft' then 'sent' else status end,
         sent_at       = now(),
         sent_channels = p_channels
   where id = p_quote_id;

  if 'email' = any(p_channels) then
    perform public._notify_quote_sent(p_quote_id, p_token_plain, p_message);
  end if;
exception when others then
  raise warning 'send_quote [%] sqlstate=% msg=% quote=%', _cid, sqlstate, sqlerrm, p_quote_id;
  raise;
end $fn$;

-- 7) Grants.
grant execute on function public.create_quote_approval_token(uuid) to authenticated;
grant execute on function public.send_quote(uuid, text[], text, text) to authenticated;
revoke execute on function public._quote_email_html(uuid, text, text) from public, anon, authenticated;
revoke execute on function public._notify_quote_sent(uuid, text, text) from public, anon, authenticated;
