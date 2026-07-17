// Oferta promocional editable (jsonb en tenant_landing_config.promo_offer). Snake_case = como se guarda/lee.
// La consume el público (PromoPopup/PromoToast) y la edita el panel (PromoOfferForm).
export interface PromoOffer {
  is_active?: boolean; auto_show?: boolean;
  badge?: string; title?: string; description?: string; cta_text?: string; toast_text?: string;
  promo_price?: number; regular_price?: number; price_suffix?: string;
  service_id?: string | null; coupon_code?: string | null;
}
