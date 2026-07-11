import { useI18n } from "@shared/i18n";
import type { PkgSectionProps } from "@landing/presentation/package-modal.hooks";

export function PackageMetaSection({ form, set }: PkgSectionProps) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  return (
    <div className="space-y-3">
      <label className="block"><span className={lbl}>{t("metaTitle")}</span>
        <input value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className={fld} /></label>
      <label className="block"><span className={lbl}>{t("metaDescription")}</span>
        <textarea value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={2} className={fld} /></label>
      <label className="block"><span className={lbl}>{t("displayOrder")}</span>
        <input type="number" value={form.displayOrder} onChange={(e) => set("displayOrder", Number(e.target.value))} className={`w-24 ${fld}`} /></label>
    </div>
  );
}
