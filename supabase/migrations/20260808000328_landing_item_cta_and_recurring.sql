-- LANDING-HOME-UX Rodaja C: CTA editable por-item + flag is_recurring derivado del form.
-- 1) cta_label text nullable en las 3 tablas de items. 2) el RPC de home devuelve cta_label + is_recurring
-- por item (is_recurring = el form resuelto tiene un campo field_key='frequency', misma logica que OrderModal.isSub;
-- resolucion de form = item.form_id o el form default del tenant, igual que _public_resolve_form_id / caso #81).
-- Preserva orden featured-first + cap 50 (Rodaja B), grants (CREATE OR REPLACE) y SECURITY DEFINER.
alter table public.tenant_landing_products add column if not exists cta_label text;
alter table public.tenant_landing_services add column if not exists cta_label text;
alter table public.tenant_landing_packages add column if not exists cta_label text;

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
    'featured_products', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,price,compare_at_price,currency,primary_image_url,cta_label,exists(select 1 from public.tenant_order_form_fields fld where fld.form_id = coalesce(public.tenant_landing_products.form_id,(select f.id from public.tenant_order_forms f where f.tenant_id=_t and f.is_default and f.is_active limit 1)) and fld.field_key='frequency') as is_recurring from public.tenant_landing_products where tenant_id=_t and is_active and is_published order by is_featured desc, display_order asc limit 50) x),'[]'::jsonb),
    'featured_services', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,pricing_type,price,price_unit,primary_image_url,cta_label,exists(select 1 from public.tenant_order_form_fields fld where fld.form_id = coalesce(public.tenant_landing_services.form_id,(select f.id from public.tenant_order_forms f where f.tenant_id=_t and f.is_default and f.is_active limit 1)) and fld.field_key='frequency') as is_recurring from public.tenant_landing_services where tenant_id=_t and is_active and is_published order by is_featured desc, display_order asc limit 50) x),'[]'::jsonb),
    'featured_packages', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,price,compare_at_price,currency,primary_image_url,badge_label,cta_label,exists(select 1 from public.tenant_order_form_fields fld where fld.form_id = coalesce(public.tenant_landing_packages.form_id,(select f.id from public.tenant_order_forms f where f.tenant_id=_t and f.is_default and f.is_active limit 1)) and fld.field_key='frequency') as is_recurring from public.tenant_landing_packages where tenant_id=_t and is_active and is_published order by is_featured desc, display_order asc limit 50) x),'[]'::jsonb),
    'testimonials', coalesce((select jsonb_agg(to_jsonb(x)) from (select client_name,client_title,client_avatar_url,content,rating from public.tenant_landing_testimonials where tenant_id=_t and is_active order by display_order limit 6) x),'[]'::jsonb),
    'faqs_preview', coalesce((select jsonb_agg(to_jsonb(x)) from (select question,answer,category from public.tenant_landing_faqs where tenant_id=_t and is_active order by display_order limit 6) x),'[]'::jsonb));
end $function$

