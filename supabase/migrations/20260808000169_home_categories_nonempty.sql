-- packages-visible / catálogo — al hacer clic en un chip de categoría vacía (ej. "Limpieza", 0 ítems) el catálogo
-- mostraba el estado vacío → comportamiento inconsistente ("unos chips dan resultado, otros no"). Los chips salen de
-- _public_get_landing_home.categories (consumido tanto por el strip del home como por los filtros del catálogo), que
-- devolvía TODAS las categorías activas sin importar si tenían ítems publicados.
--
-- Fix: la subquery de categories ahora exige que la categoría tenga ≥1 producto O servicio activo+publicado
-- (los paquetes no tienen category_id). Así toda categoría visible en los chips siempre rinde resultados.
-- Solo se modifica esa subquery; el resto del RPC (hero/featured/testimonials/faqs) queda idéntico. Genérico
-- para cualquier tenant (una categoría vacía nueva se auto-oculta hasta que se le asignan ítems).

create or replace function public._public_get_landing_home(_hostname text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare _t uuid;
begin
  if not public._landing_rl(_hostname||':home',120) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  return jsonb_build_object(
    'hero', (select to_jsonb(c) from public.tenant_landing_config c where c.tenant_id=_t),
    'categories', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,icon_name,image_url,category_type,display_order from public.tenant_landing_categories c where c.tenant_id=_t and c.is_active and (exists (select 1 from public.tenant_landing_products p where p.tenant_id=_t and p.category_id=c.id and p.is_active and p.is_published) or exists (select 1 from public.tenant_landing_services s where s.tenant_id=_t and s.category_id=c.id and s.is_active and s.is_published)) order by display_order) x),'[]'::jsonb),
    'featured_products', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,price,compare_at_price,currency,primary_image_url from public.tenant_landing_products where tenant_id=_t and is_active and is_published and is_featured order by display_order limit 8) x),'[]'::jsonb),
    'featured_services', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,pricing_type,price,price_unit,primary_image_url from public.tenant_landing_services where tenant_id=_t and is_active and is_published and is_featured order by display_order limit 6) x),'[]'::jsonb),
    'featured_packages', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,price,compare_at_price,currency,primary_image_url,badge_label from public.tenant_landing_packages where tenant_id=_t and is_active and is_published and is_featured order by display_order) x),'[]'::jsonb),
    'testimonials', coalesce((select jsonb_agg(to_jsonb(x)) from (select client_name,client_title,client_avatar_url,content,rating from public.tenant_landing_testimonials where tenant_id=_t and is_active order by display_order limit 6) x),'[]'::jsonb),
    'faqs_preview', coalesce((select jsonb_agg(to_jsonb(x)) from (select question,answer,category from public.tenant_landing_faqs where tenant_id=_t and is_active order by display_order limit 6) x),'[]'::jsonb));
end $function$;
