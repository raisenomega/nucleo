import { useState } from "react";
import { toProductInput } from "@landing/infrastructure/landing-product.mapper";
import type { ProductInput, ProductWithCategory } from "@landing/domain/landing.types";

export type SetFn = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => void;
export type SectionProps = { form: ProductInput; set: SetFn };

const DEFAULTS: ProductInput = {
  categoryId: null, slug: "", sku: "", name: "", shortDescription: "", longDescription: "",
  price: 0, compareAtPrice: null, currency: "USD", taxRate: 11.5, stripePriceId: null,
  trackInventory: false, stockQuantity: null, lowStockThreshold: 5,
  primaryImageUrl: null, galleryImages: [], videoUrl: null,
  isActive: true, isFeatured: false, displayOrder: 0,
  attributes: {}, metaTitle: "", metaDescription: "", isPublished: false, formId: null,
};

// Estado + validación del ProductModal (extraído para que el modal quede orquestador puro).
export function useProductForm(initial?: ProductWithCategory) {
  const [form, setForm] = useState<ProductInput>(initial ? toProductInput(initial) : DEFAULTS);
  const set: SetFn = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const canSave = form.name.trim().length > 0 && form.slug.trim().length > 0 && form.price >= 0;
  return { form, set, canSave };
}
