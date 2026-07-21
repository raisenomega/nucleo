// Tier de precios (camelCase) + config de la sección. La landing lee; el editor /web/precios escribe.
export interface PricingTierRow {
  id: string; nameEs: string; nameEn: string;
  price: number; currency: string; billingPeriod: string;
  taglineEs: string; taglineEn: string;
  featuresEs: string[]; featuresEn: string[];
  ctaLabelEs: string; ctaLabelEn: string; ctaHref: string;
  isRecommended: boolean; isActive: boolean; displayOrder: number;
}
// `disclaimer*` = nota bajo los tiers (hoy: setup de implementación). Editable en /web/precios.
export interface PricingConfig {
  id: string; eyebrowEs: string; eyebrowEn: string; titleEs: string; titleEn: string;
  disclaimerEs: string; disclaimerEn: string;
}
export type PricingTierDraft = Omit<PricingTierRow, "id"> & { id?: string };

// Add-on (complemento) que se muestra debajo de los planes.
export interface PricingAddonRow {
  id: string; nameEs: string; nameEn: string; descEs: string; descEn: string;
  price: number; currency: string; billingPeriod: string; isActive: boolean; displayOrder: number;
}
export type PricingAddonDraft = Omit<PricingAddonRow, "id"> & { id?: string };
