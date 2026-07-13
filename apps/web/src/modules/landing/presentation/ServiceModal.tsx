import { useState } from "react";
import { X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useServiceForm } from "@landing/presentation/service-modal.hooks";
import { ServiceBasicInfoSection } from "@landing/presentation/ServiceBasicInfoSection";
import { ServicePricingSection } from "@landing/presentation/ServicePricingSection";
import { ServiceDurationSection } from "@landing/presentation/ServiceDurationSection";
import { ServiceImageSection } from "@landing/presentation/ServiceImageSection";
import { GalleryImagesEditor } from "@landing/presentation/GalleryImagesEditor";
import { HighlightsEditor } from "@landing/presentation/HighlightsEditor";
import { ServiceMetaSection } from "@landing/presentation/ServiceMetaSection";
import type { LandingCategory, ServiceInput, ServiceWithCategory } from "@landing/domain/landing.types";

export function ServiceModal({ initial, categories, onSave, onClose }: {
  initial?: ServiceWithCategory; categories: LandingCategory[];
  onSave: (input: ServiceInput) => Promise<void>; onClose: () => void;
}) {
  const { t } = useI18n();
  const { form, set, canSave } = useServiceForm(initial);
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
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("edit") : t("newService")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4 text-foreground">
        <ServiceBasicInfoSection form={form} set={set} categories={categories} />
        <ServicePricingSection form={form} set={set} />
        <ServiceDurationSection form={form} set={set} />
        <ServiceImageSection form={form} set={set} />
        <GalleryImagesEditor value={form.galleryImages} onChange={(v) => set("galleryImages", v)} />
        <HighlightsEditor value={form.highlights} onChange={(v) => set("highlights", v)} />
        <ServiceMetaSection form={form} set={set} />
        <button type="button" disabled={busy || !canSave} onClick={() => void submit()}
          className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("save")}</button>
      </div>
    </ScreenModal>
  );
}
