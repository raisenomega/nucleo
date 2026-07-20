// Feature de la landing (camelCase) + config de la sección. La landing lee; el editor /web/features escribe.
export interface MarketingFeatureRow {
  id: string; iconName: string;
  titleEs: string; titleEn: string;
  descEs: string; descEn: string;
  bulletsEs: string[]; bulletsEn: string[];
  displayOrder: number; colSpan: number; isActive: boolean;
}
export interface FeaturesConfig { id: string; eyebrowEs: string; eyebrowEn: string; titleEs: string; titleEn: string }
export type FeatureDraft = Omit<MarketingFeatureRow, "id"> & { id?: string };
