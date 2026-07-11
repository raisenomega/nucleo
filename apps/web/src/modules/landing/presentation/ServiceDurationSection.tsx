import { useI18n } from "@shared/i18n";
import type { SvcSectionProps } from "@landing/presentation/service-modal.hooks";

export function ServiceDurationSection({ form, set }: SvcSectionProps) {
  const { t } = useI18n();
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block"><span className={lbl}>{t("durationMinutes")}</span>
          <input type="number" value={form.durationEstimateMinutes ?? ""} onChange={(e) => set("durationEstimateMinutes", e.target.value === "" ? null : Number(e.target.value))} className={`w-32 ${fld}`} /></label>
        <label className="flex items-center gap-2 pb-2 text-sm text-foreground"><input type="checkbox" checked={form.requiresScheduling} onChange={(e) => set("requiresScheduling", e.target.checked)} /> {t("requiresScheduling")}</label>
      </div>
      <p className="text-xs text-muted-foreground">{t("durationHelp")}</p>
    </div>
  );
}
