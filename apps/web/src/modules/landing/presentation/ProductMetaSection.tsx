import { useI18n } from "@shared/i18n";
import type { SectionProps } from "@landing/presentation/product-modal.hooks";

export function ProductMetaSection({ form, set }: SectionProps) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  return (
    <div className="space-y-3">
      <label className="block"><span className={lbl}>{t("metaTitle")}</span>
        <input value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className={fld} /></label>
      <label className="block"><span className={lbl}>{t("metaDescription")}</span>
        <textarea value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={2} className={fld} /></label>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 pb-2 text-sm text-foreground"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /> {t("featured")}</label>
        <label className="block"><span className={lbl}>{t("displayOrder")}</span>
          <input type="number" value={form.displayOrder} onChange={(e) => set("displayOrder", Number(e.target.value))} className={`w-24 ${fld}`} /></label>
      </div>
    </div>
  );
}
