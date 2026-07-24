-- =============================================
-- Ola 2.8b · DETECCIÓN DE BOTS IA + REFERRALS DE IA
-- Dos señales distintas: ai_crawl (un bot IA leyó tu contenido — server-side) y ai_referral (un humano llegó
-- desde una respuesta de IA — client-side). El schema de 2.8a ya está vivo; esto añade los event_types nuevos,
-- clasificadores y la RPC server-side para crawls. NO cuenta como page_view (métricas humanas limpias).
-- =============================================

-- 1. Extender el CHECK de event_type. La constraint del padre es LOCAL (conislocal=true); las de las particiones
-- la HEREDAN (coninhcount=1, conislocal=false) → drop+add en el padre CASCADEA a todas las particiones, y las
-- particiones futuras (create_monthly_partitions vía CREATE TABLE ... PARTITION OF) la heredan al crearse.
alter table public.tenant_landing_analytics drop constraint if exists tenant_landing_analytics_event_type_check;
alter table public.tenant_landing_analytics add constraint tenant_landing_analytics_event_type_check
  check (event_type in (
    'page_view','product_view','service_view','faq_view','blog_view',
    'add_to_cart','remove_from_cart','checkout_started','checkout_completed',
    'form_contact_submitted','form_quote_submitted','form_order_submitted',
    'phone_click','whatsapp_click','email_click','social_click',
    'ai_crawl','ai_referral'
  ));

-- 2. Clasificar un user-agent como bot IA (server-side). NULL = no es bot IA.
create or replace function public._classify_ai_bot(_ua text)
 returns text language sql immutable as $function$
  select case
    when _ua is null then null
    when _ua ilike '%GPTBot%' then 'openai_gptbot'
    when _ua ilike '%OAI-SearchBot%' then 'openai_search'
    when _ua ilike '%ChatGPT-User%' then 'openai_user'
    when _ua ilike '%ClaudeBot%' or _ua ilike '%anthropic-ai%' or _ua ilike '%Claude-Web%' then 'anthropic'
    when _ua ilike '%PerplexityBot%' or _ua ilike '%Perplexity-User%' then 'perplexity'
    when _ua ilike '%Google-Extended%' then 'google_extended'
    when _ua ilike '%CCBot%' then 'common_crawl'
    when _ua ilike '%Bytespider%' then 'bytedance'
    when _ua ilike '%Amazonbot%' then 'amazon'
    when _ua ilike '%meta-externalagent%' or _ua ilike '%FacebookBot%' then 'meta'
    when _ua ilike '%Applebot-Extended%' then 'apple'
    when _ua ilike '%cohere-ai%' then 'cohere'
    else null
  end;
$function$;

-- 3. Clasificar un referrer como fuente IA (client-side). NULL = no vino de IA.
create or replace function public._classify_ai_referrer(_ref text)
 returns text language sql immutable as $function$
  select case
    when _ref is null then null
    when _ref ilike '%chatgpt.com%' or _ref ilike '%chat.openai.com%' then 'chatgpt'
    when _ref ilike '%perplexity.ai%' then 'perplexity'
    when _ref ilike '%claude.ai%' then 'claude'
    when _ref ilike '%gemini.google.com%' or _ref ilike '%bard.google.com%' then 'gemini'
    when _ref ilike '%copilot.microsoft.com%' or _ref ilike '%bing.com/chat%' then 'copilot'
    when _ref ilike '%you.com%' then 'you'
    when _ref ilike '%poe.com%' then 'poe'
    else null
  end;
$function$;

-- 4. RPC server-side para registrar crawls IA. Sin rate-limit de visitor (los bots no tienen). Resuelve el
-- tenant por host (allowed_origins); los handlers llms/sitemap solo sirven el host de plataforma → sentinela.
create or replace function public.track_ai_crawl(_payload jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _bot text := public._classify_ai_bot(_payload->>'user_agent');
  _host text := lower(trim(coalesce(_payload->>'host','')));
  _tenant uuid; _platform uuid := '00000000-0000-0000-0000-0000000000a1';
begin
  if _bot is null then return jsonb_build_object('status','not_ai'); end if;
  _tenant := public._landing_resolve_tenant(_host);
  if _tenant is null then
    if regexp_replace(_host,'^www\.','') in ('nucleoraisen.com','nucleo-blush.vercel.app','localhost') then _tenant := _platform;
    else return jsonb_build_object('status','skip'); end if;
  end if;
  begin
    insert into public.tenant_landing_analytics (tenant_id, event_type, path, user_agent, metadata)
    values (_tenant, 'ai_crawl', _payload->>'path', _payload->>'user_agent',
      jsonb_build_object('bot', _bot, 'resource', _payload->>'resource'));
  exception when others then return jsonb_build_object('status','skip'); end;
  return jsonb_build_object('status','ok','bot',_bot);
end $function$;
grant execute on function public.track_ai_crawl(jsonb) to anon, authenticated;

-- 5. Extender get_landing_analytics con el bloque 'ai' (crawls por bot + referrals por fuente). Los crawls NO
-- cuentan como visits (event_type propio). Resto del cuerpo IDÉNTICO a 2.8a.
create or replace function public.get_landing_analytics(_days int default 30)
 returns jsonb language sql stable security definer set search_path to 'public' as $function$
  with t as (select case when public.can_access_module('settings','view') then public.current_tenant() else null end tid,
             (now() - (_days||' days')::interval) since),
  ev as (select a.* from public.tenant_landing_analytics a, t where a.tenant_id=t.tid and a.created_at >= t.since)
  select jsonb_build_object(
    'visits', (select count(*) from ev where event_type='page_view'),
    'visitors', (select count(distinct visitor_id) from ev),
    'sessions', (select count(distinct session_id) from ev),
    'conversions', (select count(*) from ev where event_type in ('form_contact_submitted','form_quote_submitted','form_order_submitted','checkout_completed')),
    'top_pages', (select coalesce(jsonb_agg(jsonb_build_object('path',path,'views',c) order by c desc),'[]'::jsonb)
      from (select coalesce(nullif(path,''),'/') path, count(*) c from ev where event_type='page_view' group by 1 order by 2 desc limit 10) s),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('source',src,'count',c) order by c desc),'[]'::jsonb)
      from (select case when coalesce(referrer,'')='' then 'directo' else regexp_replace(regexp_replace(referrer,'^https?://(www\.)?',''),'/.*$','') end src, count(*) c from ev where event_type='page_view' group by 1 order by 2 desc limit 8) s),
    'by_day', (select coalesce(jsonb_agg(jsonb_build_object('day',d::text,'visits',c) order by d),'[]'::jsonb)
      from (select created_at::date d, count(*) c from ev where event_type='page_view' group by 1) s),
    'conversions_by_type', (select coalesce(jsonb_object_agg(event_type,c),'{}'::jsonb)
      from (select event_type, count(*) c from ev where event_type in ('form_contact_submitted','form_quote_submitted','form_order_submitted','checkout_completed') group by 1) s),
    'ai', jsonb_build_object(
      'crawls', (select count(*) from ev where event_type='ai_crawl'),
      'crawls_by_bot', (select coalesce(jsonb_agg(jsonb_build_object('bot',bot,'count',c,'last',lst::text) order by c desc),'[]'::jsonb)
        from (select metadata->>'bot' bot, count(*) c, max(created_at) lst from ev where event_type='ai_crawl' group by 1 order by 2 desc) s),
      'referrals', (select count(*) from ev where event_type='ai_referral'),
      'referrals_by_source', (select coalesce(jsonb_agg(jsonb_build_object('source',src,'count',c) order by c desc),'[]'::jsonb)
        from (select metadata->>'source' src, count(*) c from ev where event_type='ai_referral' group by 1 order by 2 desc) s),
      'referral_conversions', (select count(distinct visitor_id) from ev where event_type in ('form_contact_submitted','form_quote_submitted','form_order_submitted','checkout_completed')
        and visitor_id in (select visitor_id from ev where event_type='ai_referral'))
    )
  );
$function$;
grant execute on function public.get_landing_analytics(int) to authenticated;
