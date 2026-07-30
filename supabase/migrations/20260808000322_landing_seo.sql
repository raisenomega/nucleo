-- SEO-DOMAIN-FIX: la landing de tenant no emitía <title>/meta en SSR (landingHead devuelve {} en dominios de
-- tenant a propósito) → Google indexaba el default del root "Portal". Fix: RPC de SEO por hostname con
-- fallbacks + canonical a www; + columna blog_url por tenant (el footer tenía blog.zramos.com hardcoded).

alter table public.tenant_landing_config add column if not exists blog_url text;

-- SEO del tenant por hostname (anon, SSR). title/description con fallback a display_name/hero; canonical → www.
create or replace function public._public_get_landing_seo(_hostname text)
 returns jsonb language plpgsql stable security definer set search_path to 'public'
as $function$
declare _t uuid; _r jsonb; _canon text;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','none'); end if;
  _canon := 'https://www.' || regexp_replace(lower(_hostname), '^(www\.|app\.|staging\.)', '') || '/';
  select jsonb_build_object('status','ok',
    'title', coalesce(nullif(trim(cfg.meta_title),''), nullif(trim(t.display_name),''), t.legal_name),
    'description', coalesce(nullif(trim(cfg.meta_description),''), nullif(trim(cfg.hero_subtitle),''),
      'Servicio profesional. Cotiza en línea y coordina tu visita.'),
    'image', coalesce(nullif(cfg.meta_og_image_url,''), th.logo_url),
    'canonical', _canon)
  into _r from public.tenants t
    left join public.tenant_themes th on th.tenant_id=t.id
    left join public.tenant_landing_config cfg on cfg.tenant_id=t.id
  where t.id=_t;
  return _r;
end $function$;
revoke execute on function public._public_get_landing_seo(text) from public;
grant execute on function public._public_get_landing_seo(text) to anon, authenticated;

-- Seed Zafacones: SEO real + blog correcto (solo si están vacíos; no pisa lo que el CEO edite luego).
update public.tenant_landing_config set
  meta_title = coalesce(nullif(trim(meta_title),''), 'Zafacones Ramos — Limpieza y mantenimiento de zafacones en Puerto Rico'),
  meta_description = coalesce(nullif(trim(meta_description),''), 'Servicio profesional de limpieza, pintura e instalación de zafacones en Puerto Rico. Suscripciones, cotización en línea y pago con tarjeta.'),
  blog_url = coalesce(blog_url, 'https://zafaconesramos.blog')
where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310';
