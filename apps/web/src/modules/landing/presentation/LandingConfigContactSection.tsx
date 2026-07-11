import { useI18n } from "@shared/i18n";
import { BusinessHoursEditor } from "@shared/components/BusinessHoursEditor";
import type { LandingConfig } from "@landing/domain/landing.types";

export function LandingConfigContactSection({ c, set }: { c: LandingConfig; set: (p: Partial<LandingConfig>) => void }) {
  const { t } = useI18n();
  const f = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-3">
      <input value={c.publicPhone} onChange={(e) => set({ publicPhone: e.target.value })} placeholder={t("publicPhone")} className={f} />
      <input value={c.publicWhatsapp} onChange={(e) => set({ publicWhatsapp: e.target.value })} placeholder={t("publicWhatsapp")} className={f} />
      <input value={c.publicEmail} onChange={(e) => set({ publicEmail: e.target.value })} placeholder={t("publicEmail")} className={f} />
      <input value={c.publicAddress} onChange={(e) => set({ publicAddress: e.target.value })} placeholder={t("publicAddress")} className={f} />
      <label className="text-xs font-bold text-muted-foreground">{t("businessHoursLabel")}</label>
      <BusinessHoursEditor value={c.businessHours} onChange={(h) => set({ businessHours: h })} />
    </div>
  );
}
