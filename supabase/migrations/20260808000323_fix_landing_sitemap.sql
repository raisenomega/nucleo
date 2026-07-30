-- SITEMAP-TENANT-FIX: el RPC _public_get_landing_sitemap generaba paths en español (/producto//servicio/
-- /paquete/) que NO existen como rutas (las reales son /product//service//package/ en inglés) → sitemap con
-- 404s. También emitía /blog/{slug} interno, pero el blog es EXTERNO (blog_url) → 404. Fix: paths correctos,
-- quitar /blog interno, añadir /catalog y /preguntas-frecuentes (páginas públicas fijas). El handler Nitro
-- (sitemap-handler.ts) empieza a servir este sitemap en los dominios de tenant (antes 404 a propósito).

create or replace function public._public_get_landing_sitemap(_hostname text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare _t uuid;
begin
  if not public._landing_rl(_hostname||':sitemap',30) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  return jsonb_build_object('urls',
    jsonb_build_array(
      jsonb_build_object('loc','/','priority',1.0,'changefreq','daily'),
      jsonb_build_object('loc','/catalog','priority',0.7,'changefreq','weekly'),
      jsonb_build_object('loc','/preguntas-frecuentes','priority',0.5,'changefreq','monthly'))
    || coalesce((select jsonb_agg(jsonb_build_object('loc','/product/'||slug,'lastmod',updated_at,'priority',0.8,'changefreq','weekly')) from public.tenant_landing_products where tenant_id=_t and is_active and is_published),'[]'::jsonb)
    || coalesce((select jsonb_agg(jsonb_build_object('loc','/service/'||slug,'lastmod',updated_at,'priority',0.8,'changefreq','weekly')) from public.tenant_landing_services where tenant_id=_t and is_active and is_published),'[]'::jsonb)
    || coalesce((select jsonb_agg(jsonb_build_object('loc','/package/'||slug,'lastmod',updated_at,'priority',0.7,'changefreq','weekly')) from public.tenant_landing_packages where tenant_id=_t and is_active and is_published),'[]'::jsonb));
end $function$;
grant execute on function public._public_get_landing_sitemap(text) to anon, authenticated;
