import type { LandingPackage, PackageInput, PackageMode } from "@landing/domain/landing-package.types";

export interface PackageRow {
  id: string; slug: string; name: string; short_description: string | null; long_description: string | null;
  price: number | string; compare_at_price: number | string | null; currency: string;
  included_products: { product_id: string; quantity: number }[] | null;
  included_services: { service_id: string; quantity: number }[] | null;
  features_list: string[] | null; primary_image_url: string | null;
  is_active: boolean; is_featured: boolean; display_order: number;
  badge_label: string | null; meta_title: string | null; meta_description: string | null; is_published: boolean;
}

// Modo derivado (no se persiste): con items en algún jsonb -> bundle; si no -> simple.
export const derivePackageMode = (p: LandingPackage): PackageMode =>
  p.includedProducts.length > 0 || p.includedServices.length > 0 ? "bundle" : "simple";

export const toLandingPackage = (r: PackageRow): LandingPackage => ({
  id: r.id, slug: r.slug, name: r.name, shortDescription: r.short_description ?? "", longDescription: r.long_description ?? "",
  price: Number(r.price), compareAtPrice: r.compare_at_price == null ? null : Number(r.compare_at_price), currency: r.currency,
  includedProducts: (r.included_products ?? []).map((x) => ({ productId: x.product_id, quantity: x.quantity })),
  includedServices: (r.included_services ?? []).map((x) => ({ serviceId: x.service_id, quantity: x.quantity })),
  featuresList: r.features_list ?? [], primaryImageUrl: r.primary_image_url,
  isActive: r.is_active, isFeatured: r.is_featured, displayOrder: r.display_order,
  badgeLabel: r.badge_label ?? "", metaTitle: r.meta_title ?? "", metaDescription: r.meta_description ?? "", isPublished: r.is_published,
});

export const toPackageInput = (p: LandingPackage): PackageInput => {
  const { id: _id, ...rest } = p; void _id; return rest;
};

export const fromLandingPackageInput = (i: PackageInput) => ({
  slug: i.slug, name: i.name, short_description: i.shortDescription || null, long_description: i.longDescription || null,
  price: i.price, compare_at_price: i.compareAtPrice, currency: i.currency,
  included_products: i.includedProducts.map((x) => ({ product_id: x.productId, quantity: x.quantity })),
  included_services: i.includedServices.map((x) => ({ service_id: x.serviceId, quantity: x.quantity })),
  features_list: i.featuresList.filter((f) => f.trim() !== ""), primary_image_url: i.primaryImageUrl,
  is_active: i.isActive, is_featured: i.isFeatured, display_order: i.displayOrder,
  badge_label: i.badgeLabel || null, meta_title: i.metaTitle || null, meta_description: i.metaDescription || null, is_published: i.isPublished,
});
