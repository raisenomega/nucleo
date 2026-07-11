import { useI18n } from "@shared/i18n";
import { ImageUploadWithCrop } from "@shared/components/ImageUploadWithCrop";
import type { LandingConfig, CtaType } from "@landing/domain/landing.types";

export function LandingConfigHeroSection({ c, set }: { c: LandingConfig; set: (p: Partial<LandingConfig>) => void }) {
  const { t } = useI18n();
  const f = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-3">
      <input value={c.heroTitle} onChange={(e) => set({ heroTitle: e.target.value })} placeholder={t("heroTitle")} className={f} />
      <input value={c.heroSubtitle} onChange={(e) => set({ heroSubtitle: e.target.value })} placeholder={t("heroSubtitle")} className={f} />
      <input value={c.heroCtaLabel} onChange={(e) => set({ heroCtaLabel: e.target.value })} placeholder={t("heroCtaLabel")} className={f} />
      <select value={c.heroCtaType} onChange={(e) => set({ heroCtaType: e.target.value as CtaType })} className={f}>
        <option value="quote">{t("ctaQuote")}</option><option value="order">{t("ctaOrder")}</option>
        <option value="contact">{t("ctaContact")}</option><option value="custom">{t("ctaCustom")}</option>
      </select>
      {c.heroCtaType === "custom" && <input value={c.heroCtaHref} onChange={(e) => set({ heroCtaHref: e.target.value })} placeholder={t("heroCtaHref")} className={f} />}
      <label className="text-xs font-bold text-muted-foreground">{t("heroImage")}</label>
      <ImageUploadWithCrop entityType="hero" aspectRatio={16 / 9} value={c.heroImageUrl} onUploaded={(u) => set({ heroImageUrl: u })} />
    </div>
  );
}
