-- =============================================
-- LANDING PAGES DE CAMPAÑA — R1: esqueleto (tablas + RLS + RPCs)
-- Las páginas de plataforma usan el tenant SENTINELA (…00a1), NUNCA tenant_id NULL (en Postgres NULL <> NULL
-- en un UNIQUE → dos páginas de plataforma con el mismo slug no chocarían). El CHECK lista los 14 tipos desde
-- ya, aunque R1 solo implemente 3 renderers → R3 no necesita migración.
-- =============================================

create table if not exists public.campaign_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default '00000000-0000-0000-0000-0000000000a1' references public.tenants(id),
  name text not null,
  slug text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  og_image_url text,
  lang text not null default 'es' check (lang in ('es','en','both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_pages_slug_unique unique (tenant_id, slug)
);
create index if not exists idx_campaign_pages_lookup on public.campaign_pages (tenant_id, slug) where is_published;

create table if not exists public.campaign_blocks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default '00000000-0000-0000-0000-0000000000a1' references public.tenants(id),
  page_id uuid not null references public.campaign_pages(id) on delete cascade,
  block_type text not null check (block_type in (
    'hero','text','benefits','image','video','testimonials',
    'pricing','faq','form','cta_banner','countdown','divider',
    'logo_bar','features_grid'
  )),
  display_order int not null default 0,
  content_es jsonb not null default '{}',
  content_en jsonb,
  config jsonb not null default '{}',
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_campaign_blocks_page on public.campaign_blocks (page_id, display_order) where is_visible;

-- RLS: lectura pública SOLO de publicadas/visibles (los writes y el preview van por RPCs SECURITY DEFINER).
alter table public.campaign_pages enable row level security;
alter table public.campaign_blocks enable row level security;
drop policy if exists cp_public_read on public.campaign_pages;
create policy cp_public_read on public.campaign_pages for select using (is_published);
drop policy if exists cb_public_read on public.campaign_blocks;
create policy cb_public_read on public.campaign_blocks for select using (
  is_visible and exists (select 1 from public.campaign_pages p where p.id = page_id and p.is_published));

-- Quién puede gestionar: superadmin sobre el sentinela; CEO del tenant sobre las suyas (R5 activa el lado tenant).
create or replace function public._campaign_can_manage(_tenant uuid)
 returns boolean language sql stable set search_path to 'public' as $$
  select (_tenant = '00000000-0000-0000-0000-0000000000a1' and public.is_superadmin())
      or (_tenant is not distinct from public.current_tenant() and public.can_access_module('settings','edit'));
$$;

-- Lectura pública para servir /c/{slug} (SSR). Resuelve host→tenant (o sentinela para Raisen) + trae el tema.
-- El preview (borradores) solo se honra si el que llama PUEDE gestionar esa página → anon nunca ve borradores.
create or replace function public._public_get_campaign_page(_host text, _slug text, _preview boolean default false)
 returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $function$
declare _sentinel uuid := '00000000-0000-0000-0000-0000000000a1'; _h text := lower(trim(coalesce(_host,'')));
  _tenant uuid; _page public.campaign_pages; _blocks jsonb; _brand jsonb; _drafts boolean;
begin
  _tenant := public._landing_resolve_tenant(_h);
  if _tenant is null then
    if regexp_replace(_h,'^www\.','') in ('nucleoraisen.com','nucleo-blush.vercel.app','localhost') then _tenant := _sentinel;
    else return null; end if;
  end if;
  _drafts := coalesce(_preview,false) and public._campaign_can_manage(_tenant);
  select * into _page from public.campaign_pages where tenant_id=_tenant and slug=_slug and (_drafts or is_published) limit 1;
  if _page.id is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'block_type',b.block_type,'display_order',b.display_order,
      'content_es',b.content_es,'content_en',b.content_en,'config',b.config) order by b.display_order),'[]'::jsonb)
    into _blocks from public.campaign_blocks b where b.page_id=_page.id and b.is_visible;
  if _tenant = _sentinel then _brand := null; else
    select jsonb_build_object('primary_color',th.primary_color,'accent_color',th.accent_color,'logo_url',th.logo_url,
      'display_name',coalesce(nullif(trim(t.display_name),''),t.legal_name),'theme_variant',th.default_mode) into _brand
    from public.tenants t left join public.tenant_themes th on th.tenant_id=t.id where t.id=_tenant;
  end if;
  return jsonb_build_object('page',jsonb_build_object('id',_page.id,'name',_page.name,'slug',_page.slug,
    'is_published',_page.is_published,'seo_title',_page.seo_title,'seo_description',_page.seo_description,
    'og_image_url',_page.og_image_url,'lang',_page.lang),'blocks',_blocks,'brand',_brand);
end $function$;
grant execute on function public._public_get_campaign_page(text,text,boolean) to anon, authenticated;

-- ---- RPCs de gestión (superadmin/CEO) ----
create or replace function public.upsert_campaign_page(_payload jsonb)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid; _id uuid := nullif(_payload->>'id','')::uuid; _slug text := lower(trim(_payload->>'slug'));
begin
  _tenant := case when public.is_superadmin() then '00000000-0000-0000-0000-0000000000a1' else public.current_tenant() end;
  if not public._campaign_can_manage(_tenant) then raise exception 'NOT_AUTHORIZED'; end if;
  if _slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'INVALID_SLUG'; end if;
  if _id is null then
    insert into public.campaign_pages (tenant_id, name, slug, seo_title, seo_description, og_image_url, lang)
    values (_tenant, _payload->>'name', _slug, _payload->>'seo_title', _payload->>'seo_description',
      _payload->>'og_image_url', coalesce(_payload->>'lang','es')) returning id into _id;
  else
    update public.campaign_pages set name=_payload->>'name', slug=_slug, seo_title=_payload->>'seo_title',
      seo_description=_payload->>'seo_description', og_image_url=_payload->>'og_image_url',
      lang=coalesce(_payload->>'lang','es'), updated_at=now()
    where id=_id and _campaign_can_manage(tenant_id);
  end if;
  return _id;
end $function$;
grant execute on function public.upsert_campaign_page(jsonb) to authenticated;

create or replace function public.publish_campaign_page(_id uuid, _published boolean)
 returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  update public.campaign_pages set is_published=_published,
    published_at = case when _published and published_at is null then now() else published_at end, updated_at=now()
  where id=_id and public._campaign_can_manage(tenant_id);
  if not found then raise exception 'NOT_AUTHORIZED'; end if;
end $function$;
grant execute on function public.publish_campaign_page(uuid, boolean) to authenticated;

create or replace function public.delete_campaign_page(_id uuid)
 returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  delete from public.campaign_pages where id=_id and public._campaign_can_manage(tenant_id);
  if not found then raise exception 'NOT_AUTHORIZED'; end if;
end $function$;
grant execute on function public.delete_campaign_page(uuid) to authenticated;

create or replace function public.upsert_campaign_block(_payload jsonb)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _id uuid := nullif(_payload->>'id','')::uuid; _page public.campaign_pages;
begin
  select * into _page from public.campaign_pages where id=(_payload->>'page_id')::uuid;
  if _page.id is null or not public._campaign_can_manage(_page.tenant_id) then raise exception 'NOT_AUTHORIZED'; end if;
  if _id is null then
    insert into public.campaign_blocks (tenant_id, page_id, block_type, display_order, content_es, content_en, config, is_visible)
    values (_page.tenant_id, _page.id, _payload->>'block_type', coalesce((_payload->>'display_order')::int,0),
      coalesce(_payload->'content_es','{}'::jsonb), _payload->'content_en', coalesce(_payload->'config','{}'::jsonb),
      coalesce((_payload->>'is_visible')::boolean, true)) returning id into _id;
  else
    update public.campaign_blocks set content_es=coalesce(_payload->'content_es',content_es),
      content_en=coalesce(_payload->'content_en',content_en), config=coalesce(_payload->'config',config),
      is_visible=coalesce((_payload->>'is_visible')::boolean, is_visible), updated_at=now() where id=_id and page_id=_page.id;
  end if;
  return _id;
end $function$;
grant execute on function public.upsert_campaign_block(jsonb) to authenticated;

create or replace function public.delete_campaign_block(_id uuid)
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid;
begin
  select tenant_id into _t from public.campaign_blocks where id=_id;
  if _t is null or not public._campaign_can_manage(_t) then raise exception 'NOT_AUTHORIZED'; end if;
  delete from public.campaign_blocks where id=_id;
end $function$;
grant execute on function public.delete_campaign_block(uuid) to authenticated;

create or replace function public.reorder_campaign_blocks(_page_id uuid, _ordered_ids uuid[])
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid;
begin
  select tenant_id into _t from public.campaign_pages where id=_page_id;
  if _t is null or not public._campaign_can_manage(_t) then raise exception 'NOT_AUTHORIZED'; end if;
  update public.campaign_blocks b set display_order = ord.idx, updated_at=now()
  from (select unnest(_ordered_ids) id, generate_subscripts(_ordered_ids,1) - 1 idx) ord
  where b.id = ord.id and b.page_id = _page_id;
end $function$;
grant execute on function public.reorder_campaign_blocks(uuid, uuid[]) to authenticated;

-- Lecturas para el editor (managers): lista de páginas + una página con TODOS sus bloques (incl. ocultos).
create or replace function public.list_campaign_pages()
 returns jsonb language sql stable security definer set search_path to 'public' as $function$
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'slug',p.slug,'is_published',p.is_published,
    'updated_at',p.updated_at,'blocks',(select count(*) from public.campaign_blocks b where b.page_id=p.id))
    order by p.updated_at desc),'[]'::jsonb)
  from public.campaign_pages p where public._campaign_can_manage(p.tenant_id);
$function$;
grant execute on function public.list_campaign_pages() to authenticated;

create or replace function public.get_campaign_page_admin(_id uuid)
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare _page public.campaign_pages; _blocks jsonb;
begin
  select * into _page from public.campaign_pages where id=_id;
  if _page.id is null or not public._campaign_can_manage(_page.tenant_id) then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'block_type',b.block_type,'display_order',b.display_order,
      'content_es',b.content_es,'content_en',b.content_en,'config',b.config,'is_visible',b.is_visible) order by b.display_order),'[]'::jsonb)
    into _blocks from public.campaign_blocks b where b.page_id=_id;
  return jsonb_build_object('page',to_jsonb(_page),'blocks',_blocks);
end $function$;
grant execute on function public.get_campaign_page_admin(uuid) to authenticated;
