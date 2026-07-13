import type { LandingService, ServiceInput, ServiceWithCategory, PricingType } from "@landing/domain/landing.types";
import { cleanHighlights, type ItemHighlight } from "@shared/types/item-highlight.types";

// Fila cruda de tenant_landing_services. gallery_images/highlights: cards-polish #85.
export interface ServiceRow {
  id: string; category_id: string | null; slug: string; name: string;
  short_description: string | null; long_description: string | null;
  pricing_type: PricingType; price: number | string | null; price_unit: string | null;
  duration_estimate_minutes: number | null; requires_scheduling: boolean;
  primary_image_url: string | null; gallery_images: string[] | null; highlights: ItemHighlight[] | null;
  is_active: boolean; is_featured: boolean; display_order: number;
  meta_title: string | null; meta_description: string | null; is_published: boolean;
  tenant_landing_categories?: { name: string }[] | { name: string } | null;
}
const catName = (c: ServiceRow["tenant_landing_categories"]): string | null =>
  (Array.isArray(c) ? c[0]?.name : c?.name) ?? null;

export const toLandingService = (r: ServiceRow): ServiceWithCategory => ({
  id: r.id, categoryId: r.category_id, slug: r.slug, name: r.name,
  shortDescription: r.short_description ?? "", longDescription: r.long_description ?? "",
  pricingType: r.pricing_type, price: r.price == null ? null : Number(r.price), priceUnit: r.price_unit,
  durationEstimateMinutes: r.duration_estimate_minutes, requiresScheduling: r.requires_scheduling,
  primaryImageUrl: r.primary_image_url, galleryImages: r.gallery_images ?? [], highlights: r.highlights ?? [],
  isActive: r.is_active, isFeatured: r.is_featured, displayOrder: r.display_order,
  metaTitle: r.meta_title ?? "", metaDescription: r.meta_description ?? "", isPublished: r.is_published,
  categoryName: catName(r.tenant_landing_categories),
});

export const toServiceInput = (s: LandingService): ServiceInput => ({
  categoryId: s.categoryId, slug: s.slug, name: s.name, shortDescription: s.shortDescription,
  longDescription: s.longDescription, pricingType: s.pricingType, price: s.price, priceUnit: s.priceUnit,
  durationEstimateMinutes: s.durationEstimateMinutes, requiresScheduling: s.requiresScheduling,
  primaryImageUrl: s.primaryImageUrl, galleryImages: s.galleryImages, highlights: s.highlights,
  isActive: s.isActive, isFeatured: s.isFeatured, displayOrder: s.displayOrder,
  metaTitle: s.metaTitle, metaDescription: s.metaDescription, isPublished: s.isPublished,
});

export const fromLandingServiceInput = (i: ServiceInput) => ({
  category_id: i.categoryId, slug: i.slug, name: i.name, short_description: i.shortDescription || null,
  long_description: i.longDescription || null, pricing_type: i.pricingType, price: i.price, price_unit: i.priceUnit || null,
  duration_estimate_minutes: i.durationEstimateMinutes, requires_scheduling: i.requiresScheduling,
  primary_image_url: i.primaryImageUrl, gallery_images: i.galleryImages, highlights: cleanHighlights(i.highlights),
  is_active: i.isActive, is_featured: i.isFeatured, display_order: i.displayOrder,
  meta_title: i.metaTitle || null, meta_description: i.metaDescription || null, is_published: i.isPublished,
});
