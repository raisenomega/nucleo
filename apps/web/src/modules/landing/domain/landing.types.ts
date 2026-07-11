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

export interface LandingProduct {
  id: string; categoryId: string | null; slug: string; sku: string; name: string;
  shortDescription: string; longDescription: string;
  price: number; compareAtPrice: number | null; currency: string; taxRate: number | null; stripePriceId: string | null;
  trackInventory: boolean; stockQuantity: number | null; lowStockThreshold: number | null;
  primaryImageUrl: string | null; galleryImages: string[]; videoUrl: string | null;
  isActive: boolean; isFeatured: boolean; displayOrder: number;
  attributes: Record<string, unknown>; metaTitle: string; metaDescription: string; isPublished: boolean;
}
export type ProductInput = Omit<LandingProduct, "id">;
export type ProductWithCategory = LandingProduct & { categoryName: string | null };
export interface ILandingProductsRepository {
  list(): Promise<ProductWithCategory[]>;
  get(id: string): Promise<ProductWithCategory | null>;
  create(tenantId: string, input: ProductInput): Promise<Result>;
  update(id: string, input: ProductInput): Promise<Result>;
  remove(id: string): Promise<Result>;
}

export type PricingType = "fixed" | "starting_from" | "quote_required" | "hourly";
export interface LandingService {
  id: string; categoryId: string | null; slug: string; name: string;
  shortDescription: string; longDescription: string;
  pricingType: PricingType; price: number | null; priceUnit: string | null;
  durationEstimateMinutes: number | null; requiresScheduling: boolean;
  primaryImageUrl: string | null; isActive: boolean; isFeatured: boolean; displayOrder: number;
  metaTitle: string; metaDescription: string; isPublished: boolean;
}
export type ServiceInput = Omit<LandingService, "id">;
export type ServiceWithCategory = LandingService & { categoryName: string | null };
export interface ILandingServicesRepository {
  list(): Promise<ServiceWithCategory[]>;
  get(id: string): Promise<ServiceWithCategory | null>;
  create(tenantId: string, input: ServiceInput): Promise<Result>;
  update(id: string, input: ServiceInput): Promise<Result>;
  remove(id: string): Promise<Result>;
}
