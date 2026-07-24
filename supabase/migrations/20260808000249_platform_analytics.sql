-- =============================================
-- Ola 2.8c · ANALYTICS DE PLATAFORMA (Super Admin)
-- El dashboard avanzado del superadmin: el embudo comercial completo de nucleoraisen.com. Lee SOLO el tenant
-- sentinela (…00a1) para el tráfico; el embudo cruza analytics + marketing_leads + marketing_reservations
-- (ambas platform-global, sin tenant_id → se cuentan enteras). Gate estricto is_superadmin().
-- =============================================

create or replace function public.get_platform_analytics(_days int default 30)
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare _sentinel uuid := '00000000-0000-0000-0000-0000000000a1';
  _since timestamptz := now() - (_days||' days')::interval;
  _prev  timestamptz := now() - ((2*_days)||' days')::interval;
  _visits int; _leads int; _demos int; _crawls int; _cprev int; result jsonb;
begin
  if not public.is_superadmin() then return jsonb_build_object('error','forbidden'); end if;
  select count(*) into _visits from public.tenant_landing_analytics where tenant_id=_sentinel and event_type='page_view' and created_at >= _since;
  select count(*) into _leads  from public.marketing_leads where created_at >= _since;
  select count(*) into _demos  from public.marketing_reservations where created_at >= _since;
  select count(*) into _crawls from public.tenant_landing_analytics where tenant_id=_sentinel and event_type='ai_crawl' and created_at >= _since;
  select count(*) into _cprev  from public.tenant_landing_analytics where tenant_id=_sentinel and event_type='ai_crawl' and created_at >= _prev and created_at < _since;

  with ev as (select a.* from public.tenant_landing_analytics a where a.tenant_id=_sentinel and a.created_at >= _since)
  select jsonb_build_object(
    'traffic', jsonb_build_object(
      'visits', _visits,
      'visitors', (select count(distinct visitor_id) from ev),
      'sessions', (select count(distinct session_id) from ev),
      'by_day', (select coalesce(jsonb_agg(jsonb_build_object('day',d::text,'visits',c) order by d),'[]'::jsonb)
        from (select created_at::date d, count(*) c from ev where event_type='page_view' group by 1) s),
      'top_pages', (select coalesce(jsonb_agg(jsonb_build_object('path',path,'views',c) order by c desc),'[]'::jsonb)
        from (select coalesce(nullif(path,''),'/') path, count(*) c from ev where event_type='page_view' group by 1 order by 2 desc limit 10) s),
      'sources', (select coalesce(jsonb_agg(jsonb_build_object('source',src,'count',c) order by c desc),'[]'::jsonb)
        from (select case when public._classify_ai_referrer(referrer) is not null then 'IA'
            when coalesce(referrer,'')='' then 'directo'
            when referrer ilike '%google.%' or referrer ilike '%bing.%' or referrer ilike '%duckduckgo.%' then 'buscadores'
            when referrer ilike '%facebook.%' or referrer ilike '%instagram.%' or referrer ilike '%linkedin.%' or referrer ilike '%t.co%' or referrer ilike '%twitter.%' or referrer ilike '%x.com%' then 'redes'
            else 'referral' end src, count(*) c from ev where event_type='page_view' group by 1 order by 2 desc) s),
      'devices', (select coalesce(jsonb_object_agg(dev,c),'{}'::jsonb)
        from (select case when user_agent ilike '%Mobi%' then 'mobile' else 'desktop' end dev, count(*) c from ev where event_type='page_view' group by 1) s)
    ),
    'funnel', jsonb_build_object('visits', _visits, 'leads', _leads, 'demos', _demos,
      'visit_to_lead', case when _visits>0 then round(100.0*_leads/_visits,1) else 0 end,
      'lead_to_demo',  case when _leads>0  then round(100.0*_demos/_leads,1) else 0 end),
    'ai', jsonb_build_object(
      'crawls', _crawls, 'crawls_prev', _cprev,
      'trend_pct', case when _cprev=0 then null else round(100.0*(_crawls-_cprev)/_cprev,0) end,
      'crawls_by_bot', (select coalesce(jsonb_agg(jsonb_build_object('bot',bot,'count',c,'last',lst::text) order by c desc),'[]'::jsonb)
        from (select metadata->>'bot' bot, count(*) c, max(created_at) lst from ev where event_type='ai_crawl' group by 1 order by 2 desc) s),
      'by_resource', (select coalesce(jsonb_agg(jsonb_build_object('resource',res,'count',c) order by c desc),'[]'::jsonb)
        from (select coalesce(metadata->>'resource','?') res, count(*) c from ev where event_type='ai_crawl' group by 1 order by 2 desc) s),
      'referrals', (select count(*) from ev where event_type='ai_referral'),
      'referrals_by_source', (select coalesce(jsonb_agg(jsonb_build_object('source',src,'count',c) order by c desc),'[]'::jsonb)
        from (select metadata->>'source' src, count(*) c from ev where event_type='ai_referral' group by 1 order by 2 desc) s),
      'referral_conversions', (select count(distinct visitor_id) from ev where event_type in ('form_contact_submitted','form_quote_submitted','form_order_submitted','checkout_completed')
        and visitor_id in (select visitor_id from ev where event_type='ai_referral'))
    ),
    'campaigns', (select coalesce(jsonb_agg(jsonb_build_object('campaign',camp,'visits',vis,'leads',lds) order by vis desc, lds desc),'[]'::jsonb)
      from (select coalesce(nullif(x.utm_campaign,''),'(sin campaña)') camp,
              count(*) filter (where x.k='v') vis, count(*) filter (where x.k='l') lds
        from (select utm_campaign, 'v' k from ev where event_type='page_view' and coalesce(utm_campaign,'')<>''
              union all
              select utm_campaign, 'l' k from public.marketing_leads where created_at >= _since and coalesce(utm_campaign,'')<>'') x
        group by 1) s)
  ) into result;
  return result;
end $function$;
grant execute on function public.get_platform_analytics(int) to authenticated;
