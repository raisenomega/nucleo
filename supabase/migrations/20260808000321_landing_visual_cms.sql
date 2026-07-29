-- LANDING-VISUAL-1: control fino del landing público (a nivel raíz, todos los tenants).
-- (1) Sección "Contáctanos" configurable (toggles + textos) vía contact_config jsonb.
-- (2) Footer: 2 redes más (LinkedIn, X) además de FB/IG/YT/TikTok.
-- (3) FAQs: página pública dedicada (_public_get_faqs) + seed base para tenants sin FAQs.
-- El landing público lee tenant_landing_config completo por to_jsonb (home.hero) → las columnas
-- nuevas fluyen solas; solo hay que exponer social_linkedin/x en el resolver de marca.

alter table public.tenant_landing_config
  add column if not exists contact_config jsonb,
  add column if not exists social_linkedin text,
  add column if not exists social_x text;

-- (2) Resolver de marca: añadir linkedin + x al social_links (lo consume el footer vía PublicBrand).
create or replace function public._public_resolve_tenant_by_host(_hostname text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare _t uuid; _r jsonb;
begin
  if not public._landing_rl(_hostname||':resolve',300) then return jsonb_build_object('status','error','code','rate_limited','message','rate'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','landing_disabled','message','Landing no disponible'); end if;
  select jsonb_build_object('tenant_id',t.id,'slug',t.slug,'display_name',coalesce(nullif(trim(t.display_name),''),t.legal_name),
    'landing_enabled',t.landing_enabled,'stripe_enabled',t.stripe_enabled,'default_language','es',
    'primary_color',th.primary_color,'accent_color',th.accent_color,'logo_url',th.logo_url,'favicon_url',th.favicon_url,
    'contact_phone',coalesce(cfg.public_phone,t.contact_phone),'contact_email',cfg.public_email,
    'social_links',jsonb_build_object('facebook',cfg.social_facebook,'instagram',cfg.social_instagram,'youtube',cfg.social_youtube,
      'tiktok',cfg.social_tiktok,'linkedin',cfg.social_linkedin,'x',cfg.social_x))
  into _r from public.tenants t
    left join public.tenant_themes th on th.tenant_id=t.id
    left join public.tenant_landing_config cfg on cfg.tenant_id=t.id
  where t.id=_t;
  return _r;
end $function$;

-- (3) Página pública de FAQs: marca del tenant + TODAS las FAQs activas (para /preguntas-frecuentes).
create or replace function public._public_get_faqs(_hostname text)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid; _r jsonb;
begin
  if not public._landing_rl(_hostname||':faqs',120) then return jsonb_build_object('status','rate_limited'); end if;
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','landing_disabled'); end if;
  select jsonb_build_object('status','valid',
    'tenant', jsonb_build_object('display_name',coalesce(nullif(trim(t.display_name),''),t.legal_name),
      'logo_url',th.logo_url,'primary_color',th.primary_color),
    'faqs', coalesce((select jsonb_agg(to_jsonb(x)) from (select question,answer,category
      from public.tenant_landing_faqs where tenant_id=_t and is_active order by display_order) x),'[]'::jsonb))
  into _r from public.tenants t left join public.tenant_themes th on th.tenant_id=t.id where t.id=_t;
  return _r;
end $function$;
revoke execute on function public._public_get_faqs(text) from public;
grant execute on function public._public_get_faqs(text) to anon, authenticated;

-- Seed base: 5 FAQs genéricas para tenants con landing activo y SIN FAQs activas (editable desde el CMS).
insert into public.tenant_landing_faqs(tenant_id, question, answer, display_order, is_active, language)
select t.id, f.q, f.a, f.ord, true, 'es'
from public.tenants t
cross join (values
  (1,'¿Cómo agendo un servicio?','Puedes agendar directamente desde nuestra página con el botón de contacto o coordinando una visita.'),
  (2,'¿Cuáles son sus formas de pago?','Aceptamos pago con tarjeta de crédito/débito y otros métodos según disponibilidad.'),
  (3,'¿Hacen servicio a domicilio?','Sí, coordinamos el servicio en tu ubicación según la zona de cobertura.'),
  (4,'¿Cuál es la garantía?','Nuestros servicios y productos cuentan con garantía; escríbenos para los detalles de tu caso.'),
  (5,'¿Cómo cancelo mi suscripción?','Puedes cancelarla en cualquier momento escribiéndonos; seguirá activa hasta el fin del período ya pagado.')
) as f(ord,q,a)
where t.landing_enabled and not exists (select 1 from public.tenant_landing_faqs fq where fq.tenant_id=t.id and fq.is_active);
