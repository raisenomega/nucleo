import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import type { SvcSectionProps } from "@landing/presentation/service-modal.hooks";
import type { PricingType } from "@landing/domain/landing.types";

const PT_KEY: Record<PricingType, TranslationKey> = { fixed: "ptFixed", starting_from: "ptStartingFrom", hourly: "ptHourly", quote_required: "ptQuoteRequired" };
const PU_KEY: Record<string, TranslationKey> = { hour: "puHour", day: "puDay", job: "puJob", visit: "puVisit", session: "puSession" };
const UNITS = Object.keys(PU_KEY);

export function ServicePricingSection({ form, set }: SvcSectionProps) {
  const { t } = useI18n();
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  const unitSel = form.priceUnit == null ? "" : UNITS.includes(form.priceUnit) ? form.priceUnit : "custom";
  return (
    <div className="flex flex-wrap gap-3">
      <label className="block"><span className={lbl}>{t("pricingType")}</span>
        <select value={form.pricingType} onChange={(e) => set("pricingType", e.target.value as PricingType)} className={fld}>
          {(Object.keys(PT_KEY) as PricingType[]).map((p) => <option key={p} value={p}>{t(PT_KEY[p])}</option>)}
        </select></label>
      {form.pricingType !== "quote_required" && <label className="block"><span className={lbl}>{t("price")}</span>
        <input type="number" step="0.01" value={form.price ?? ""} onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value))} className={`w-32 ${fld}`} /></label>}
      <label className="block"><span className={lbl}>{t("priceUnit")}</span>
        <select value={unitSel} onChange={(e) => set("priceUnit", e.target.value === "" ? null : e.target.value === "custom" ? "" : e.target.value)} className={fld}>
          <option value="">—</option>
          {UNITS.map((u) => <option key={u} value={u}>{t(PU_KEY[u]!)}</option>)}
          <option value="custom">{t("puCustom")}</option>
        </select></label>
      {unitSel === "custom" && <label className="block"><span className={lbl}>{t("priceUnitCustom")}</span>
        <input value={form.priceUnit ?? ""} onChange={(e) => set("priceUnit", e.target.value)} className={fld} /></label>}
    </div>
  );
}
