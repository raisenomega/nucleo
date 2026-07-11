// BC landing — panel de edición. Puro (sin infra). Tipos + interfaces de repositorio.
export type Result = { ok: true } | { ok: false; error: string };
export type BusinessHours = Record<string, { open: string; close: string } | null>;
export type CtaType = "quote" | "order" | "contact" | "custom";
export type CategoryType = "product" | "service" | "both";

export interface LandingConfig {
  heroTitle: string; heroSubtitle: string; heroCtaLabel: string; heroCtaType: CtaType; heroCtaHref: string;
  heroImageUrl: string | null; heroVideoUrl: string | null;
  metaTitle: string; metaDescription: string; metaOgImageUrl: string | null; metaKeywords: string[];
  publicPhone: string; publicWhatsapp: string; publicEmail: string; publicAddress: string;
  businessHours: BusinessHours | null;
  socialFacebook: string; socialInstagram: string; socialYoutube: string; socialTiktok: string;
  schemaBusinessType: string; schemaGeoLat: number | null; schemaGeoLng: number | null; schemaPriceRange: string;
}

export interface LandingCategory {
  id: string; slug: string; name: string; description: string; iconName: string | null; imageUrl: string | null;
  displayOrder: number; isActive: boolean; categoryType: CategoryType;
}
export type CategoryInput = Omit<LandingCategory, "id">;

export interface ILandingConfigRepository {
  get(): Promise<LandingConfig | null>;
  upsert(tenantId: string, input: LandingConfig): Promise<Result>;
}
export interface ILandingCategoriesRepository {
  list(): Promise<LandingCategory[]>;
  create(tenantId: string, input: CategoryInput): Promise<Result>;
  update(id: string, input: CategoryInput): Promise<Result>;
  remove(id: string): Promise<Result>;
}
