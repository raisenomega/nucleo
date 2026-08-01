-- SIDE-8 (commit 2) · El sitemap anuncia la página buena de cada servicio.
--
-- SITUACIÓN: hay DOS rutas por servicio y no son un duplicado accidental:
--   /service/{slug}   -> ficha estándar (ServiceDetailPage)
--   /servicios/{slug} -> página dedicada y rica, con `landing_hero` configurado desde el CMS
-- El sitemap sólo anunciaba /service/, así que la pieza comercial más trabajada del tenant era invisible
-- para Google. Y encima /servicios/ devolvía un 307 por el bug de validateSearch (arreglado en el frontend
-- de este mismo commit).
--
-- DECISIÓN DEL OWNER: cuando un servicio tiene página rica, ESA es la canónica. Aquí el sitemap deja de
-- anunciar /service/{slug} para esos servicios y anuncia /servicios/{slug} en su lugar, con prioridad más
-- alta porque es la página con contenido comercial completo. Los servicios SIN página rica siguen igual.
-- El lado del canonical lo pone el frontend: /service/{slug} emite <link rel="canonical"> apuntando a
-- /servicios/{slug} cuando la rica existe.
--
-- Hoy en Zafacones: 2 de 6 servicios tienen landing_hero (hydro-jet-250 y membresia-regular).
-- El resto de la función queda byte-idéntico: mismos productos, paquetes y páginas fijas.
create or replace function public._public_get_landing_sitemap(_hostname text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $$
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
    -- Servicios SIN página dedicada: sigue valiendo la ficha estándar.
    || coalesce((select jsonb_agg(jsonb_build_object('loc','/service/'||slug,'lastmod',updated_at,'priority',0.8,'changefreq','weekly')) from public.tenant_landing_services where tenant_id=_t and is_active and is_published and landing_hero is null),'[]'::jsonb)
    -- Servicios CON página dedicada: se anuncia la rica, y sólo ella, para que no compitan entre sí.
    || coalesce((select jsonb_agg(jsonb_build_object('loc','/servicios/'||slug,'lastmod',updated_at,'priority',0.9,'changefreq','weekly')) from public.tenant_landing_services where tenant_id=_t and is_active and is_published and landing_hero is not null),'[]'::jsonb)
    || coalesce((select jsonb_agg(jsonb_build_object('loc','/package/'||slug,'lastmod',updated_at,'priority',0.7,'changefreq','weekly')) from public.tenant_landing_packages where tenant_id=_t and is_active and is_published),'[]'::jsonb));
end $$;
revoke execute on function public._public_get_landing_sitemap(text) from public, authenticated;
grant execute on function public._public_get_landing_sitemap(text) to anon, authenticated;
