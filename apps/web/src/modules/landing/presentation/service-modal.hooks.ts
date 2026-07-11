import { useState } from "react";
import { toServiceInput } from "@landing/infrastructure/landing-service.mapper";
import type { ServiceInput, ServiceWithCategory } from "@landing/domain/landing.types";

export type SetSvc = <K extends keyof ServiceInput>(k: K, v: ServiceInput[K]) => void;
export type SvcSectionProps = { form: ServiceInput; set: SetSvc };

const DEFAULTS: ServiceInput = {
  categoryId: null, slug: "", name: "", shortDescription: "", longDescription: "",
  pricingType: "quote_required", price: null, priceUnit: null,
  durationEstimateMinutes: null, requiresScheduling: true,
  primaryImageUrl: null, isActive: true, isFeatured: false, displayOrder: 0,
  metaTitle: "", metaDescription: "", isPublished: false,
};

// Estado + validación del ServiceModal. price requerido salvo pricing_type='quote_required' (D1).
export function useServiceForm(initial?: ServiceWithCategory) {
  const [form, setForm] = useState<ServiceInput>(initial ? toServiceInput(initial) : DEFAULTS);
  const set: SetSvc = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const priceNeeded = form.pricingType !== "quote_required";
  const canSave = form.name.trim().length > 0 && form.slug.trim().length > 0 && (!priceNeeded || (form.price != null && form.price >= 0));
  return { form, set, canSave };
}
