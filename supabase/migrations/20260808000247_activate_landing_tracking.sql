-- =============================================
-- Ola 2.8a · ACTIVAR EL TRACKING — la RPC productora que faltaba
-- El schema (tenant_landing_analytics + particiones + agregados + retención) ya existía DORMIDO (0 eventos,
-- sin policy INSERT, sin RPC). Esto añade el productor: RPC anon-callable con rate-limit + tenant sentinela.
-- =============================================

-- 1. Tenant sentinela de plataforma (para eventos de nucleoraisen.com; tenant_id es NOT NULL + FK). Sin triggers en tenants.
insert into public.tenants (id, slug, legal_name, landing_enabled)
values ('00000000-0000-0000-0000-0000000000a1', '_platform', 'NÚCLEO Plataforma', false)
on conflict (id) do nothing;

-- 2. RPC de tracking (única puerta de escritura pública). Fire-and-forget desde el cliente.
create or replace function public.track_landing_event(_payload jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _host text := lower(trim(coalesce(_payload->>'host','')));
  _tenant uuid; _event text := _payload->>'event_type'; _visitor text := _payload->>'visitor_id'; _recent int;
  _platform uuid := '00000000-0000-0000-0000-0000000000a1';
begin
  if _event is null then return jsonb_build_object('status','skip'); end if;
  _tenant := public._landing_resolve_tenant(_host);   -- por allowed_origins; null para hosts no-tenant
  if _tenant is null then
    if regexp_replace(_host,'^www\.','') in ('nucleoraisen.com','nucleo-blush.vercel.app','localhost') then _tenant := _platform;
    else return jsonb_build_object('status','skip'); end if;   -- host desconocido → silencioso (no rompe la landing)
  end if;
  -- RATE LIMIT: máx 30 eventos por visitor en 60s (única puerta pública)
  if _visitor is not null and _visitor <> '' then
    select count(*) into _recent from public.tenant_landing_analytics where visitor_id=_visitor and created_at > now() - interval '60 seconds';
    if _recent >= 30 then return jsonb_build_object('status','rate_limited'); end if;
  end if;
  begin
    insert into public.tenant_landing_analytics (tenant_id, event_type, path, entity_id, session_id, visitor_id, referrer, user_agent, utm_source, utm_medium, utm_campaign, metadata)
    values (_tenant, _event, _payload->>'path', nullif(_payload->>'entity_id','')::uuid, _payload->>'session_id', _visitor,
      _payload->>'referrer', _payload->>'user_agent', _payload->>'utm_source', _payload->>'utm_medium', _payload->>'utm_campaign', coalesce(_payload->'metadata','{}'::jsonb));
  exception when others then return jsonb_build_object('status','skip'); end;   -- event_type inválido u otro → silencioso
  return jsonb_build_object('status','ok');
end $function$;
grant execute on function public.track_landing_event(jsonb) to anon, authenticated;

-- 3. Lectura para el dashboard del tenant (últimos _days, dentro de la ventana de retención de 3 meses).
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
      from (select event_type, count(*) c from ev where event_type in ('form_contact_submitted','form_quote_submitted','form_order_submitted','checkout_completed') group by 1) s)
  );
$function$;
grant execute on function public.get_landing_analytics(int) to authenticated;

-- 4. Fix menor: crear particiones con +3 meses de colchón (antes solo +1). Idempotente.
create or replace function public.create_monthly_partitions()
 returns void language plpgsql security definer set search_path to 'public', 'extensions' as $function$
declare _i int; _start date; _end date; _p text;
begin
  for _i in 1..3 loop
    _start := (date_trunc('month', now()) + (_i||' month')::interval)::date;
    _end := (date_trunc('month', now()) + ((_i+1)||' month')::interval)::date;
    _p := 'tenant_landing_analytics_' || to_char(_start,'YYYY_MM');
    execute format('create table if not exists public.%I partition of public.tenant_landing_analytics for values from (%L) to (%L)', _p, _start, _end);
  end loop;
end $function$;
