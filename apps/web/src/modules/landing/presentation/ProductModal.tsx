import { useState } from "react";
import { X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useProductForm } from "@landing/presentation/product-modal.hooks";
import { ProductBasicInfoSection } from "@landing/presentation/ProductBasicInfoSection";
import { ProductPricingSection } from "@landing/presentation/ProductPricingSection";
import { ProductInventorySection } from "@landing/presentation/ProductInventorySection";
import { ProductImagesSection } from "@landing/presentation/ProductImagesSection";
import { ProductMetaSection } from "@landing/presentation/ProductMetaSection";
import { HighlightsEditor } from "@landing/presentation/HighlightsEditor";
import { OrderFormPicker } from "@order-forms/presentation/OrderFormPicker";
import type { LandingCategory, ProductInput, ProductWithCategory } from "@landing/domain/landing.types";

export function ProductModal({ initial, categories, onSave, onClose }: {
  initial?: ProductWithCategory; categories: LandingCategory[];
  onSave: (input: ProductInput) => Promise<void>; onClose: () => void;
}) {
  const { t } = useI18n();
  const { form, set, canSave } = useProductForm(initial);
  const [busy, setBusy] = useState(false);
  if (categories.length === 0) return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-6 text-center text-foreground">
        <p>{t("needCategoryFirst")}</p>
        <Link to="/settings/landing/categories" className="inline-block font-bold text-accent underline">{t("landingCategories")}</Link>
      </div>
    </ScreenModal>);
  async function submit() { setBusy(true); await onSave(form); setBusy(false); }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("edit") : t("newProduct")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4 text-foreground">
        <ProductBasicInfoSection form={form} set={set} categories={categories} />
        <ProductPricingSection form={form} set={set} />
        <ProductInventorySection form={form} set={set} />
        <ProductImagesSection form={form} set={set} />
        <HighlightsEditor value={form.highlights} onChange={(v) => set("highlights", v)} />
        <ProductMetaSection form={form} set={set} />
        <OrderFormPicker value={form.formId} onChange={(v) => set("formId", v)} />
        <button type="button" disabled={busy || !canSave} onClick={() => void submit()}
          className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("save")}</button>
      </div>
    </ScreenModal>
  );
}
