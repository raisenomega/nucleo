-- Migración 133: RPCs read-only del template público (3.E.1). SECURITY DEFINER + GRANT anon.
-- Helper: resuelve tenant por allowed_origins (jsonb) + landing_enabled. Null si no aplica.
create or replace function public._landing_resolve_tenant(_hostname text)
returns uuid language sql stable security definer set search_path to 'public','extensions' as $fn$
  select t.id from public.tenants t where t.landing_enabled and exists (
    select 1 from jsonb_array_elements_text(coalesce(t.allowed_origins,'[]'::jsonb)) o
    where regexp_replace(lower(trim(o)),'^https?://|^www\.|/.*$','','g') = regexp_replace(lower(trim(coalesce(_hostname,''))),'^www\.','')) limit 1;
$fn$;

-- Helper rate-limit: true si dentro del límite (ventana fija de _public_rate_hit; key hasheada por RPC).
create or replace function public._landing_rl(_key text, _limit int)
returns boolean language sql security definer set search_path to 'public','extensions' as $fn$
  select public._public_rate_hit(encode(extensions.digest(_key,'sha256'),'hex')) <= _limit;
$fn$;

create or replace function public._public_resolve_tenant_by_host(_hostname text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $fn$
declare _t uuid; _r jsonb;
begin
  if not public._landing_rl(_hostname||':resolve',300) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  select jsonb_build_object('tenant_id',t.id,'slug',t.slug,'display_name',coalesce(nullif(trim(t.display_name),''),t.legal_name),
    'landing_enabled',t.landing_enabled,'stripe_enabled',t.stripe_enabled,'default_language','es',
    'primary_color',th.primary_color,'accent_color',th.accent_color,'logo_url',th.logo_url,'favicon_url',th.favicon_url,
    'contact_phone',coalesce(cfg.public_phone,t.contact_phone),'contact_email',cfg.public_email,
    'social_links',jsonb_build_object('facebook',cfg.social_facebook,'instagram',cfg.social_instagram,'youtube',cfg.social_youtube,'tiktok',cfg.social_tiktok))
  into _r from public.tenants t
    left join public.tenant_themes th on th.tenant_id=t.id
    left join public.tenant_landing_config cfg on cfg.tenant_id=t.id
  where t.id=_t;
  return _r;
end $fn$;

create or replace function public._public_get_landing_home(_hostname text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $fn$
declare _t uuid;
begin
  if not public._landing_rl(_hostname||':home',120) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  return jsonb_build_object(
    'hero', (select to_jsonb(c) from public.tenant_landing_config c where c.tenant_id=_t),
    'categories', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,icon_name,image_url,category_type,display_order from public.tenant_landing_categories where tenant_id=_t and is_active order by display_order) x),'[]'::jsonb),
    'featured_products', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,price,compare_at_price,currency,primary_image_url from public.tenant_landing_products where tenant_id=_t and is_active and is_published and is_featured order by display_order limit 8) x),'[]'::jsonb),
    'featured_services', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,pricing_type,price,price_unit,primary_image_url from public.tenant_landing_services where tenant_id=_t and is_active and is_published and is_featured order by display_order limit 6) x),'[]'::jsonb),
    'featured_packages', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,price,compare_at_price,currency,primary_image_url,badge_label from public.tenant_landing_packages where tenant_id=_t and is_active and is_published and is_featured order by display_order) x),'[]'::jsonb),
    'testimonials', coalesce((select jsonb_agg(to_jsonb(x)) from (select client_name,client_title,client_avatar_url,content,rating from public.tenant_landing_testimonials where tenant_id=_t and is_active order by display_order limit 6) x),'[]'::jsonb),
    'faqs_preview', coalesce((select jsonb_agg(to_jsonb(x)) from (select question,answer,category from public.tenant_landing_faqs where tenant_id=_t and is_active order by display_order limit 6) x),'[]'::jsonb));
end $fn$;

create or replace function public._public_get_landing_catalog(_hostname text, _category_slug text default null, _type text default 'all', _page int default 1, _page_size int default 24)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $fn$
declare _t uuid; _cat uuid; _lim int := least(greatest(coalesce(_page_size,24),1),60); _off int := (greatest(coalesce(_page,1),1)-1)*_lim; _catj jsonb;
begin
  if not public._landing_rl(_hostname||':catalog',120) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  if _category_slug is not null then
    select id into _cat from public.tenant_landing_categories where tenant_id=_t and slug=_category_slug and is_active;
    select to_jsonb(c) into _catj from (select id,slug,name,icon_name,image_url,category_type from public.tenant_landing_categories where id=_cat) c;
  end if;
  return (with base as (
      select id,slug,name,short_description,price,compare_at_price,currency,primary_image_url,is_featured,display_order,'product' kind,category_id from public.tenant_landing_products where tenant_id=_t and is_active and is_published and _type in ('all','products')
      union all select id,slug,name,short_description,price,null,'USD',primary_image_url,is_featured,display_order,'service',category_id from public.tenant_landing_services where tenant_id=_t and is_active and is_published and _type in ('all','services')
      union all select id,slug,name,short_description,price,compare_at_price,currency,primary_image_url,is_featured,display_order,'package',null from public.tenant_landing_packages where tenant_id=_t and is_active and is_published and _type in ('all','packages')),
    filtered as (select * from base where _cat is null or category_id = _cat)
    select jsonb_build_object('items', coalesce((select jsonb_agg(to_jsonb(x)) from (select * from filtered order by is_featured desc, display_order limit _lim offset _off) x),'[]'::jsonb),
      'total',(select count(*) from filtered),'page',greatest(coalesce(_page,1),1),'page_size',_lim,'category',_catj));
end $fn$;

create or replace function public._public_get_landing_product(_hostname text, _product_slug text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $fn$
declare _t uuid; _p record;
begin
  if not public._landing_rl(_hostname||':product',240) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  select * into _p from public.tenant_landing_products where tenant_id=_t and slug=_product_slug and is_active and is_published;
  if not found then return jsonb_build_object('status','error','code','not_found','message','Producto no encontrado'); end if;
  return jsonb_build_object('product', to_jsonb(_p),
    'related', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,price,compare_at_price,currency,primary_image_url from public.tenant_landing_products where tenant_id=_t and is_active and is_published and category_id is not distinct from _p.category_id and id<>_p.id order by display_order limit 4) x),'[]'::jsonb));
end $fn$;

create or replace function public._public_get_landing_service(_hostname text, _service_slug text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $fn$
declare _t uuid; _s record;
begin
  if not public._landing_rl(_hostname||':service',240) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  select * into _s from public.tenant_landing_services where tenant_id=_t and slug=_service_slug and is_active and is_published;
  if not found then return jsonb_build_object('status','error','code','not_found','message','Servicio no encontrado'); end if;
  return jsonb_build_object('service', to_jsonb(_s),
    'related', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,pricing_type,price,price_unit,primary_image_url from public.tenant_landing_services where tenant_id=_t and is_active and is_published and category_id is not distinct from _s.category_id and id<>_s.id order by display_order limit 4) x),'[]'::jsonb));
end $fn$;

create or replace function public._public_get_landing_package(_hostname text, _package_slug text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $fn$
declare _t uuid; _pk record; _prods jsonb; _svcs jsonb;
begin
  if not public._landing_rl(_hostname||':package',240) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  select * into _pk from public.tenant_landing_packages where tenant_id=_t and slug=_package_slug and is_active and is_published;
  if not found then return jsonb_build_object('status','error','code','not_found','message','Paquete no encontrado'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('quantity',(e->>'quantity')::int,'name',p.name,'slug',p.slug,'primary_image_url',p.primary_image_url)),'[]'::jsonb) into _prods
    from jsonb_array_elements(coalesce(_pk.included_products,'[]'::jsonb)) e join public.tenant_landing_products p on p.id=(e->>'product_id')::uuid;
  select coalesce(jsonb_agg(jsonb_build_object('quantity',(e->>'quantity')::int,'name',s.name,'slug',s.slug,'primary_image_url',s.primary_image_url)),'[]'::jsonb) into _svcs
    from jsonb_array_elements(coalesce(_pk.included_services,'[]'::jsonb)) e join public.tenant_landing_services s on s.id=(e->>'service_id')::uuid;
  return jsonb_build_object('package', to_jsonb(_pk) || jsonb_build_object('included_products_expanded',_prods,'included_services_expanded',_svcs),
    'related', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,name,short_description,price,compare_at_price,currency,primary_image_url,badge_label from public.tenant_landing_packages where tenant_id=_t and is_active and is_published and id<>_pk.id order by display_order limit 4) x),'[]'::jsonb));
end $fn$;

create or replace function public._public_get_landing_blog_index(_hostname text, _page int default 1, _tag text default null)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $fn$
declare _t uuid; _lim int := 12; _off int := (greatest(coalesce(_page,1),1)-1)*12;
begin
  if not public._landing_rl(_hostname||':blogidx',120) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  return (with pub as (select * from public.tenant_landing_blog_posts where tenant_id=_t and status='published' and (_tag is null or _tag = any(tags)))
    select jsonb_build_object(
      'posts', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,title,excerpt,featured_image_url,author_name,category,tags,published_at from pub order by published_at desc nulls last limit _lim offset _off) x),'[]'::jsonb),
      'total',(select count(*) from pub),'page',greatest(coalesce(_page,1),1),
      'tags', coalesce((select jsonb_agg(distinct tg) from public.tenant_landing_blog_posts b, unnest(coalesce(b.tags, array[]::text[])) tg where b.tenant_id=_t and b.status='published'),'[]'::jsonb)));
end $fn$;

create or replace function public._public_get_landing_blog_post(_hostname text, _slug text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $fn$
declare _t uuid; _post record; _tag text;
begin
  if not public._landing_rl(_hostname||':blogpost',240) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  update public.tenant_landing_blog_posts set view_count = view_count + 1
    where tenant_id=_t and slug=_slug and status='published' returning * into _post;
  if not found then return jsonb_build_object('status','error','code','not_found','message','Post no encontrado'); end if;
  select tags[1] into _tag from public.tenant_landing_blog_posts where id=_post.id;
  return jsonb_build_object('post', to_jsonb(_post),
    'related', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,slug,title,excerpt,featured_image_url,published_at from public.tenant_landing_blog_posts where tenant_id=_t and status='published' and id<>_post.id and (_tag is null or _tag = any(tags)) order by published_at desc limit 3) x),'[]'::jsonb));
end $fn$;

create or replace function public._public_get_landing_service_areas(_hostname text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $fn$
declare _t uuid;
begin
  if not public._landing_rl(_hostname||':areas',60) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  return jsonb_build_object('areas', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,name,slug,region,geo_lat,geo_lng,radius_km,extra_charge,display_order from public.tenant_landing_service_areas where tenant_id=_t and is_active order by display_order) x),'[]'::jsonb));
end $fn$;

create or replace function public._public_get_landing_sitemap(_hostname text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $fn$
declare _t uuid;
begin
  if not public._landing_rl(_hostname||':sitemap',30) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  return jsonb_build_object('urls',
    jsonb_build_array(jsonb_build_object('loc','/','priority',1.0,'changefreq','daily'))
    || coalesce((select jsonb_agg(jsonb_build_object('loc','/producto/'||slug,'lastmod',updated_at,'priority',0.8,'changefreq','weekly')) from public.tenant_landing_products where tenant_id=_t and is_active and is_published),'[]'::jsonb)
    || coalesce((select jsonb_agg(jsonb_build_object('loc','/servicio/'||slug,'lastmod',updated_at,'priority',0.8,'changefreq','weekly')) from public.tenant_landing_services where tenant_id=_t and is_active and is_published),'[]'::jsonb)
    || coalesce((select jsonb_agg(jsonb_build_object('loc','/paquete/'||slug,'lastmod',updated_at,'priority',0.7,'changefreq','weekly')) from public.tenant_landing_packages where tenant_id=_t and is_active and is_published),'[]'::jsonb)
    || coalesce((select jsonb_agg(jsonb_build_object('loc','/blog/'||slug,'lastmod',updated_at,'priority',0.6,'changefreq','monthly')) from public.tenant_landing_blog_posts where tenant_id=_t and status='published'),'[]'::jsonb));
end $fn$;

create or replace function public._public_check_redirect(_hostname text, _path text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $fn$
declare _t uuid; _r record;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('redirect',false); end if;
  update public.tenant_landing_url_redirects set hit_count = hit_count + 1, last_hit_at = now()
    where tenant_id=_t and from_path=_path and is_active returning * into _r;
  if not found then return jsonb_build_object('redirect',false); end if;
  return jsonb_build_object('redirect',true,'to_path',_r.to_path,'code',_r.redirect_type);
end $fn$;

grant execute on function public._public_resolve_tenant_by_host(text) to anon;
grant execute on function public._public_get_landing_home(text) to anon;
grant execute on function public._public_get_landing_catalog(text,text,text,int,int) to anon;
grant execute on function public._public_get_landing_product(text,text) to anon;
grant execute on function public._public_get_landing_service(text,text) to anon;
grant execute on function public._public_get_landing_package(text,text) to anon;
grant execute on function public._public_get_landing_blog_index(text,int,text) to anon;
grant execute on function public._public_get_landing_blog_post(text,text) to anon;
grant execute on function public._public_get_landing_service_areas(text) to anon;
grant execute on function public._public_get_landing_sitemap(text) to anon;
grant execute on function public._public_check_redirect(text,text) to anon;

-- Seed de test (3.E.1): publica el producto existente de roy-ramos para verificar las RPCs (reversible).
update public.tenant_landing_products p set is_published = true
  from public.tenants t where t.id = p.tenant_id and t.slug='roy-ramos';
