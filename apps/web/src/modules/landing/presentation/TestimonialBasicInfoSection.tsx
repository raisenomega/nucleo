import { useI18n } from "@shared/i18n";
import { StarRating } from "@landing/presentation/StarRating";
import type { TSectionProps } from "@landing/presentation/testimonial-modal.hooks";

export function TestimonialBasicInfoSection({ form, set }: TSectionProps) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  return (
    <div className="space-y-3">
      <label className="block"><span className={lbl}>{t("clientName")}</span><input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} className={fld} /></label>
      <div className="flex flex-wrap gap-3">
        <label className="block"><span className={lbl}>{t("clientTitle")}</span><input value={form.clientTitle} onChange={(e) => set("clientTitle", e.target.value)} className={fld} /></label>
        <label className="block"><span className={lbl}>{t("clientCompany")}</span><input value={form.clientCompany} onChange={(e) => set("clientCompany", e.target.value)} className={fld} /></label>
      </div>
      <label className="block"><span className={lbl}>{t("testimonialContent")}</span><textarea value={form.content} onChange={(e) => set("content", e.target.value)} rows={3} className={fld} /></label>
      <div><span className={lbl}>{t("rating")}</span><StarRating value={form.rating} onChange={(v) => set("rating", v as 1 | 2 | 3 | 4 | 5)} /></div>
    </div>
  );
}
