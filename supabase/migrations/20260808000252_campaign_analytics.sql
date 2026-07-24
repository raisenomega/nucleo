-- =============================================
-- LANDING PAGES DE CAMPAÑA — R4: analytics vía el motor de 2.8 (SIN view_count/lead_count)
-- 1) get_landing_analytics gana un filtro OPCIONAL por path (drop+recreate para no dejar overload ambiguo).
-- 2) get_campaign_analytics: analytics por página, PAGE-scoped (no current_tenant, que para un superadmin no es
--    el sentinela) + gate _campaign_can_manage. 3) list_campaign_pages gana visitas30/leads en UNA query.
-- =============================================

-- 1. Filtro opcional por path. DROP del (int) para que solo exista la firma nueva → sin ambigüedad de overload.
drop function if exists public.get_landing_analytics(integer);
create or replace function public.get_landing_analytics(_days int default 30, _path text default null)
 returns jsonb language sql stable security definer set search_path to 'public' as $function$
  with t as (select case when public.can_access_module('settings','view') then public.current_tenant() else null end tid,
             (now() - (_days||' days')::interval) since),
  ev as (select a.* from public.tenant_landing_analytics a, t where a.tenant_id=t.tid and a.created_at >= t.since
         and (_path is null or a.path = _path))
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
grant execute on function public.get_landing_analytics(int, text) to authenticated;

-- 2. Analytics de UNA campaña (para el tab de rendimiento del editor). PAGE-scoped + manager-gated.
create or replace function public.get_campaign_analytics(_page_id uuid, _days int default 30)
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare _page public.campaign_pages; _since timestamptz := now() - (_days||' days')::interval;
  _sent uuid := '00000000-0000-0000-0000-0000000000a1'; _path text; _leads int; result jsonb;
begin
  select * into _page from public.campaign_pages where id=_page_id;
  if _page.id is null or not public._campaign_can_manage(_page.tenant_id) then return null; end if;
  _path := '/c/' || _page.slug;
  if _page.tenant_id = _sent then select count(*) into _leads from public.marketing_leads where campaign_page_id=_page_id and created_at >= _since;
  else select count(*) into _leads from public.leads where campaign_page_id=_page_id and created_at >= _since; end if;
  with ev as (select a.* from public.tenant_landing_analytics a where a.tenant_id=_page.tenant_id and a.path=_path and a.created_at >= _since)
  select jsonb_build_object(
    'visits', (select count(*) from ev where event_type='page_view'), 'leads', _leads,
    'conversions', (select count(*) from ev where event_type in ('form_contact_submitted','form_quote_submitted','form_order_submitted','checkout_completed')),
    'by_day', (select coalesce(jsonb_agg(jsonb_build_object('day',d::text,'visits',c) order by d),'[]'::jsonb)
      from (select created_at::date d, count(*) c from ev where event_type='page_view' group by 1) s),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('source',src,'count',c) order by c desc),'[]'::jsonb)
      from (select case when public._classify_ai_referrer(referrer) is not null then 'IA' when coalesce(referrer,'')='' then 'directo'
        when referrer ilike '%google.%' or referrer ilike '%bing.%' then 'buscadores'
        when referrer ilike '%facebook.%' or referrer ilike '%instagram.%' or referrer ilike '%linkedin.%' or referrer ilike '%t.co%' then 'redes'
        else 'referral' end src, count(*) c from ev where event_type='page_view' group by 1 order by 2 desc) s)
  ) into result;
  return result;
end $function$;
grant execute on function public.get_campaign_analytics(uuid, int) to authenticated;

-- 3. Lista con métricas (visitas 30d + leads) en UNA sola query (subconsultas correlacionadas, no N+1).
create or replace function public.list_campaign_pages()
 returns jsonb language sql stable security definer set search_path to 'public' as $function$
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'slug',p.slug,'is_published',p.is_published,
    'updated_at',p.updated_at,'blocks',(select count(*) from public.campaign_blocks b where b.page_id=p.id),
    'visits',(select count(*) from public.tenant_landing_analytics a where a.tenant_id=p.tenant_id and a.path='/c/'||p.slug and a.event_type='page_view' and a.created_at >= now()-interval '30 days'),
    'leads',(select count(*) from public.marketing_leads m where m.campaign_page_id=p.id) + (select count(*) from public.leads l where l.campaign_page_id=p.id))
    order by p.updated_at desc),'[]'::jsonb)
  from public.campaign_pages p where public._campaign_can_manage(p.tenant_id);
$function$;
grant execute on function public.list_campaign_pages() to authenticated;
