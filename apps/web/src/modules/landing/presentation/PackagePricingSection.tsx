import { useI18n } from "@shared/i18n";
import type { PkgSectionProps } from "@landing/presentation/package-modal.hooks";

export function PackagePricingSection({ form, set }: PkgSectionProps) {
  const { t } = useI18n();
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  return (
    <div className="flex flex-wrap gap-3">
      <label className="block"><span className={lbl}>{t("price")}</span>
        <input type="number" step="0.01" value={form.price} onChange={(e) => set("price", Number(e.target.value))} className={`w-32 ${fld}`} /></label>
      <label className="block"><span className={lbl}>{t("compareAtPrice")}</span>
        <input type="number" step="0.01" value={form.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", e.target.value === "" ? null : Number(e.target.value))} className={`w-32 ${fld}`} /></label>
      <label className="block"><span className={lbl}>{t("currency")}</span>
        <input value={form.currency} onChange={(e) => set("currency", e.target.value)} className={`w-24 ${fld}`} /></label>
    </div>
  );
}
