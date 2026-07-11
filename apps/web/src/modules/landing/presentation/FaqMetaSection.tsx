import { useI18n } from "@shared/i18n";
import type { FSectionProps } from "@landing/presentation/faq-modal.hooks";

export function FaqMetaSection({ form, set }: FSectionProps) {
  const { t } = useI18n();
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="block"><span className={lbl}>{t("category")}</span><input value={form.category} onChange={(e) => set("category", e.target.value)} className={fld} placeholder="General" /></label>
      <label className="block"><span className={lbl}>{t("language")}</span>
        <select value={form.language} onChange={(e) => set("language", e.target.value)} className={fld}><option value="es">ES</option><option value="en">EN</option></select></label>
      <label className="block"><span className={lbl}>{t("displayOrder")}</span><input type="number" value={form.displayOrder} onChange={(e) => set("displayOrder", Number(e.target.value))} className={`w-24 ${fld}`} /></label>
      <label className="flex items-center gap-2 pb-2 text-sm text-foreground"><input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> {t("active")}</label>
    </div>
  );
}
