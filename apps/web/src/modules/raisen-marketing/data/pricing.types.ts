// Tier de precios (camelCase) + config de la sección. La landing lee; el editor /web/precios escribe.
export interface PricingTierRow {
  id: string; nameEs: string; nameEn: string;
  price: number; currency: string; billingPeriod: string;
  taglineEs: string; taglineEn: string;
  featuresEs: string[]; featuresEn: string[];
  ctaLabelEs: string; ctaLabelEn: string; ctaHref: string;
  isRecommended: boolean; isActive: boolean; displayOrder: number;
}
export interface PricingConfig { id: string; eyebrowEs: string; eyebrowEn: string; titleEs: string; titleEn: string }
export type PricingTierDraft = Omit<PricingTierRow, "id"> & { id?: string };
