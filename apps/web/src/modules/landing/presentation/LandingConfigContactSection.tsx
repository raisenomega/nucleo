import { useI18n } from "@shared/i18n";
import { BusinessHoursEditor } from "@shared/components/BusinessHoursEditor";
import type { LandingConfig } from "@landing/domain/landing.types";
import type { ContactConfig } from "@landing/domain/contact-config.types";

export function LandingConfigContactSection({ c, set }: { c: LandingConfig; set: (p: Partial<LandingConfig>) => void }) {
  const { t } = useI18n();
  const f = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const cc = c.contactConfig ?? {};
  const setCC = (p: Partial<ContactConfig>) => set({ contactConfig: { ...cc, ...p } });
  const chk = "flex items-center gap-2 text-sm";
  return (
    <div className="space-y-3">
      <input value={c.publicPhone} onChange={(e) => set({ publicPhone: e.target.value })} placeholder={t("publicPhone")} className={f} />
      <input value={c.publicWhatsapp} onChange={(e) => set({ publicWhatsapp: e.target.value })} placeholder={t("publicWhatsapp")} className={f} />
      <input value={c.publicEmail} onChange={(e) => set({ publicEmail: e.target.value })} placeholder={t("publicEmail")} className={f} />
      <input value={c.publicAddress} onChange={(e) => set({ publicAddress: e.target.value })} placeholder={t("publicAddress")} className={f} />
      <label className="text-xs font-bold text-muted-foreground">{t("businessHoursLabel")}</label>
      <BusinessHoursEditor value={c.businessHours} onChange={(h) => set({ businessHours: h })} />
      <div className="space-y-2 rounded-lg border border-border p-3">
        <label className={`${chk} font-bold`}><input type="checkbox" checked={cc.enabled !== false} onChange={(e) => setCC({ enabled: e.target.checked })} />{t("ccSectionShow")}</label>
        <label className={chk}><input type="checkbox" checked={cc.showMessage !== false} onChange={(e) => setCC({ showMessage: e.target.checked })} />{t("ccCardMessage")}</label>
        <input value={cc.msgTitle ?? ""} onChange={(e) => setCC({ msgTitle: e.target.value })} placeholder={t("ccTitle")} className={f} />
        <input value={cc.msgDesc ?? ""} onChange={(e) => setCC({ msgDesc: e.target.value })} placeholder={t("ccDesc")} className={f} />
        <input value={cc.msgBtn ?? ""} onChange={(e) => setCC({ msgBtn: e.target.value })} placeholder={t("ccBtn")} className={f} />
        <label className={chk}><input type="checkbox" checked={cc.showVisit !== false} onChange={(e) => setCC({ showVisit: e.target.checked })} />{t("ccCardVisit")}</label>
        <input value={cc.visitTitle ?? ""} onChange={(e) => setCC({ visitTitle: e.target.value })} placeholder={t("ccTitle")} className={f} />
        <input value={cc.visitDesc ?? ""} onChange={(e) => setCC({ visitDesc: e.target.value })} placeholder={t("ccDesc")} className={f} />
        <input value={cc.visitBtn ?? ""} onChange={(e) => setCC({ visitBtn: e.target.value })} placeholder={t("ccBtn")} className={f} />
      </div>
    </div>
  );
}
