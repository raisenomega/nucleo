-- LANDING-HOME-UX Rodaja B: el home muestra TODOS los items activos (no solo is_featured, no top 8/6).
-- featured_{products,services,packages}: quita el filtro is_featured, orden is_featured DESC (destacados al
-- frente) luego display_order ASC, safety cap limit 50. El HorizontalCarousel decide grid vs carrusel (>4).
CREATE OR REPLACE FUNCTION public._public_get_landing_home(_hostname text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare _t uuid;
begin
  if not public._landing_rl(_hostname||':home',120) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  return jsonb_build_object(
    'hero', (select to_jsonb(c) from public.tenant_landing_config c where c.tenant_id=_t),
    'categories', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,icon_name,image_url,category_type,display_order from public.tenant_landing_categories c where c.tenant_id=_t and c.is_active and (exists (select 1 from public.tenant_landing_products p where p.tenant_id=_t and p.category_id=c.id and p.is_active and p.is_published) or exists (select 1 from public.tenant_landing_services s where s.tenant_id=_t and s.category_id=c.id and s.is_active and s.is_published)) order by display_order) x),'[]'::jsonb),
    'featured_products', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,price,compare_at_price,currency,primary_image_url from public.tenant_landing_products where tenant_id=_t and is_active and is_published order by is_featured desc, display_order asc limit 50) x),'[]'::jsonb),
    'featured_services', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,pricing_type,price,price_unit,primary_image_url from public.tenant_landing_services where tenant_id=_t and is_active and is_published order by is_featured desc, display_order asc limit 50) x),'[]'::jsonb),
    'featured_packages', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,price,compare_at_price,currency,primary_image_url,badge_label from public.tenant_landing_packages where tenant_id=_t and is_active and is_published order by is_featured desc, display_order asc limit 50) x),'[]'::jsonb),
    'testimonials', coalesce((select jsonb_agg(to_jsonb(x)) from (select client_name,client_title,client_avatar_url,content,rating from public.tenant_landing_testimonials where tenant_id=_t and is_active order by display_order limit 6) x),'[]'::jsonb),
    'faqs_preview', coalesce((select jsonb_agg(to_jsonb(x)) from (select question,answer,category from public.tenant_landing_faqs where tenant_id=_t and is_active order by display_order limit 6) x),'[]'::jsonb));
end $function$

