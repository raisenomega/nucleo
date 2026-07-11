import { useI18n } from "@shared/i18n";
import type { FSectionProps } from "@landing/presentation/faq-modal.hooks";

export function FaqBasicInfoSection({ form, set }: FSectionProps) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  return (
    <div className="space-y-3">
      <label className="block"><span className={lbl}>{t("question")}</span><input value={form.question} onChange={(e) => set("question", e.target.value)} className={fld} /></label>
      <label className="block"><span className={lbl}>{t("answer")}</span><textarea value={form.answer} onChange={(e) => set("answer", e.target.value)} rows={4} className={fld} /></label>
    </div>
  );
}
