import { X, Plus } from "lucide-react";
import { ImageUploadWithCrop } from "@shared/components/ImageUploadWithCrop";
import { useI18n } from "@shared/i18n";
import type { SectionProps } from "@landing/presentation/product-modal.hooks";

export function ProductImagesSection({ form, set }: SectionProps) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  const gal = form.galleryImages;
  return (
    <div className="space-y-3">
      <div><span className={lbl}>{t("primaryImage")}</span>
        <ImageUploadWithCrop entityType="products" aspectRatio={1} value={form.primaryImageUrl} onUploaded={(u) => set("primaryImageUrl", u)} /></div>
      <div><span className={lbl}>{t("galleryImages")}</span>
        {gal.map((g, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input value={g} onChange={(e) => set("galleryImages", gal.map((x, k) => (k === i ? e.target.value : x)))} placeholder="https://…" className={fld} />
            <button type="button" onClick={() => set("galleryImages", gal.filter((_, k) => k !== i))} aria-label={t("delete")}><X className="h-4 w-4 text-destructive" /></button>
          </div>))}
        <button type="button" onClick={() => set("galleryImages", [...gal, ""])} className="flex items-center gap-1 text-sm text-foreground"><Plus className="h-4 w-4" /> {t("galleryImages")}</button>
      </div>
      <label className="block"><span className={lbl}>{t("videoUrl")}</span>
        <input value={form.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value || null)} placeholder="https://…" className={fld} /></label>
    </div>
  );
}
