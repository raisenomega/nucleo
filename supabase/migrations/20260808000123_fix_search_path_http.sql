-- FIX P1.B: _notify_quote_sent no resolvía las funciones/tipo de la extensión http
-- (schema 'extensions') por tener search_path=public → fallaba con 42883 undefined_function
-- (http_set_curlopt), atrapado por el handler best-effort (email silenciosamente no enviado).
-- Fix mínimo: search_path = public, extensions (espeja a _notify_invited, que funciona).
-- Cero cambios de lógica. Auditoría Fase 0: solo esta función tiene llamadas http_* sin qualificar.

create or replace function public._notify_quote_sent(
  p_quote_id uuid, p_token_plain text, p_message text)
returns void language plpgsql security definer set search_path = public, extensions as $fn$
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

-- Limpieza del artefacto de prueba del diagnóstico DNS.
delete from public.allowed_emails where email like 'test-dns-diag-%@example.com';
