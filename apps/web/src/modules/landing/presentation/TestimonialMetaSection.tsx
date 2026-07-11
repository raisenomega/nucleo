import { useI18n } from "@shared/i18n";
import type { TSectionProps } from "@landing/presentation/testimonial-modal.hooks";

export function TestimonialMetaSection({ form, set }: TSectionProps) {
  const { t } = useI18n();
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block"><span className={lbl}>{t("language")}</span>
          <select value={form.language} onChange={(e) => set("language", e.target.value)} className={fld}><option value="es">ES</option><option value="en">EN</option></select></label>
        <label className="block"><span className={lbl}>{t("displayOrder")}</span><input type="number" value={form.displayOrder} onChange={(e) => set("displayOrder", Number(e.target.value))} className={`w-24 ${fld}`} /></label>
        <label className="flex items-center gap-2 pb-2 text-sm text-foreground"><input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> {t("active")}</label>
        <label className="flex items-center gap-2 pb-2 text-sm text-foreground"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /> {t("featured")}</label>
      </div>
      <label className="block"><span className={lbl}>{t("source")}</span><input value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="Google, Facebook…" className={`w-full ${fld}`} /></label>
    </div>
  );
}
