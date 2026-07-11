import { useI18n } from "@shared/i18n";
import type { LandingConfig } from "@landing/domain/landing.types";

export function LandingConfigSocialSchemaSection({ c, set }: { c: LandingConfig; set: (p: Partial<LandingConfig>) => void }) {
  const { t } = useI18n();
  const f = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const num = (v: string) => (v ? Number(v) : null);
  return (
    <div className="space-y-3">
      <input value={c.socialFacebook} onChange={(e) => set({ socialFacebook: e.target.value })} placeholder="Facebook" className={f} />
      <input value={c.socialInstagram} onChange={(e) => set({ socialInstagram: e.target.value })} placeholder="Instagram" className={f} />
      <input value={c.socialYoutube} onChange={(e) => set({ socialYoutube: e.target.value })} placeholder="YouTube" className={f} />
      <input value={c.socialTiktok} onChange={(e) => set({ socialTiktok: e.target.value })} placeholder="TikTok" className={f} />
      <input value={c.schemaBusinessType} onChange={(e) => set({ schemaBusinessType: e.target.value })} placeholder={t("businessType")} className={f} />
      <div className="flex gap-2">
        <input type="number" value={c.schemaGeoLat ?? ""} onChange={(e) => set({ schemaGeoLat: num(e.target.value) })} placeholder={t("geoLat")} className={f} />
        <input type="number" value={c.schemaGeoLng ?? ""} onChange={(e) => set({ schemaGeoLng: num(e.target.value) })} placeholder={t("geoLng")} className={f} />
      </div>
      <input value={c.schemaPriceRange} onChange={(e) => set({ schemaPriceRange: e.target.value })} placeholder={t("priceRange")} className={f} />
    </div>
  );
}
