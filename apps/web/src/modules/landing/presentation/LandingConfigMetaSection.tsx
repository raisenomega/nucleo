import { useI18n } from "@shared/i18n";
import { ImageUploadWithCrop } from "@shared/components/ImageUploadWithCrop";
import type { LandingConfig } from "@landing/domain/landing.types";

export function LandingConfigMetaSection({ c, set }: { c: LandingConfig; set: (p: Partial<LandingConfig>) => void }) {
  const { t } = useI18n();
  const f = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-3">
      <input value={c.metaTitle} onChange={(e) => set({ metaTitle: e.target.value })} placeholder={t("metaTitle")} className={f} />
      <textarea value={c.metaDescription} onChange={(e) => set({ metaDescription: e.target.value })} placeholder={t("metaDescription")} rows={2} className={f} />
      <input value={c.metaKeywords.join(", ")} placeholder={t("metaKeywords")} className={f}
        onChange={(e) => set({ metaKeywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
      <label className="text-xs font-bold text-muted-foreground">{t("metaOgImage")}</label>
      <ImageUploadWithCrop entityType="hero" aspectRatio={1200 / 630} value={c.metaOgImageUrl} onUploaded={(u) => set({ metaOgImageUrl: u })} />
    </div>
  );
}
