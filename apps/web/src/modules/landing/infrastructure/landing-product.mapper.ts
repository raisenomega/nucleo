import type { LandingProduct, ProductInput, ProductWithCategory } from "@landing/domain/landing.types";

// Fila cruda de tenant_landing_products (snake_case). numeric llega como string desde Supabase.
export interface ProductRow {
  id: string; category_id: string | null; slug: string; sku: string | null; name: string;
  short_description: string | null; long_description: string | null;
  price: number | string; compare_at_price: number | string | null; currency: string;
  tax_rate: number | string | null; stripe_price_id: string | null;
  track_inventory: boolean; stock_quantity: number | null; low_stock_threshold: number | null;
  primary_image_url: string | null; gallery_images: string[] | null; video_url: string | null;
  is_active: boolean; is_featured: boolean; display_order: number;
  attributes: Record<string, unknown> | null; meta_title: string | null; meta_description: string | null; is_published: boolean;
  form_id?: string | null;
  tenant_landing_categories?: { name: string }[] | { name: string } | null;
}
const catName = (c: ProductRow["tenant_landing_categories"]): string | null =>
  (Array.isArray(c) ? c[0]?.name : c?.name) ?? null;
const num = (v: number | string | null): number | null => (v == null ? null : Number(v));

export const toLandingProduct = (r: ProductRow): ProductWithCategory => ({
  id: r.id, categoryId: r.category_id, slug: r.slug, sku: r.sku ?? "", name: r.name,
  shortDescription: r.short_description ?? "", longDescription: r.long_description ?? "",
  price: Number(r.price), compareAtPrice: num(r.compare_at_price), currency: r.currency,
  taxRate: num(r.tax_rate), stripePriceId: r.stripe_price_id,
  trackInventory: r.track_inventory, stockQuantity: r.stock_quantity, lowStockThreshold: r.low_stock_threshold,
  primaryImageUrl: r.primary_image_url, galleryImages: r.gallery_images ?? [], videoUrl: r.video_url,
  isActive: r.is_active, isFeatured: r.is_featured, displayOrder: r.display_order,
  attributes: r.attributes ?? {}, metaTitle: r.meta_title ?? "", metaDescription: r.meta_description ?? "",
  isPublished: r.is_published, formId: r.form_id ?? null, categoryName: catName(r.tenant_landing_categories),
});

export const toProductInput = (p: LandingProduct): ProductInput => ({
  categoryId: p.categoryId, slug: p.slug, sku: p.sku, name: p.name, shortDescription: p.shortDescription,
  longDescription: p.longDescription, price: p.price, compareAtPrice: p.compareAtPrice, currency: p.currency,
  taxRate: p.taxRate, stripePriceId: p.stripePriceId, trackInventory: p.trackInventory, stockQuantity: p.stockQuantity,
  lowStockThreshold: p.lowStockThreshold, primaryImageUrl: p.primaryImageUrl, galleryImages: p.galleryImages,
  videoUrl: p.videoUrl, isActive: p.isActive, isFeatured: p.isFeatured, displayOrder: p.displayOrder,
  attributes: p.attributes, metaTitle: p.metaTitle, metaDescription: p.metaDescription, isPublished: p.isPublished, formId: p.formId,
});

export const fromLandingProductInput = (i: ProductInput) => ({
  category_id: i.categoryId, slug: i.slug, sku: i.sku || null, name: i.name,
  short_description: i.shortDescription || null, long_description: i.longDescription || null,
  price: i.price, compare_at_price: i.compareAtPrice, currency: i.currency, tax_rate: i.taxRate,
  stripe_price_id: i.stripePriceId, track_inventory: i.trackInventory, stock_quantity: i.stockQuantity,
  low_stock_threshold: i.lowStockThreshold, primary_image_url: i.primaryImageUrl, gallery_images: i.galleryImages,
  video_url: i.videoUrl, is_active: i.isActive, is_featured: i.isFeatured, display_order: i.displayOrder,
  attributes: i.attributes, meta_title: i.metaTitle || null, meta_description: i.metaDescription || null, is_published: i.isPublished, form_id: i.formId,
});
