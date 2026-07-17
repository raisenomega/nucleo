-- promo-offer — oferta promocional editable (replica el PromoHero del legacy). Se guarda como jsonb en
-- tenant_landing_config.promo_offer (badge/title/price/regular_price/suffix/description/cta/toast/service_id/
-- coupon_code/is_active/auto_show). No requiere tabla nueva ni cambio de RPC: _public_get_landing_home ya
-- devuelve hero = to_jsonb(tenant_landing_config), así que promo_offer llega solo al público en hero.promo_offer.

alter table public.tenant_landing_config
  add column if not exists promo_offer jsonb default '{}'::jsonb;
