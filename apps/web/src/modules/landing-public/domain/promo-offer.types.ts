// Oferta promocional editable (jsonb en tenant_landing_config.promo_offer). Snake_case = como se guarda/lee.
// La consume el público (PromoPopup/PromoToast/OrderModal) y la edita el panel (PromoOfferForm). Todo editable.
export interface PromoOffer {
  is_active?: boolean; auto_show?: boolean;
  badge?: string; title?: string; description?: string; cta_text?: string; toast_text?: string;
  promo_price?: number; regular_price?: number; price_suffix?: string;
  service_id?: string | null; coupon_code?: string | null;
  // Header del OrderModal (réplica legacy): línea de precio destacada.
  price_line?: string;
  // Resumen del pedido (réplica legacy): líneas + labels + nota recurrente.
  summary_line?: string; included_line?: string; included_label?: string; total_label?: string; recurring_note?: string;
  // Términos y condiciones de la oferta (modal).
  terms_text?: string; terms_label?: string;
}
