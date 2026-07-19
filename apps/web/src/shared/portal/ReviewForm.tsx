import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { StarRating } from "@landing/presentation/StarRating";
import type { ReviewableService, ReviewInput } from "@shared/portal/review.types";

// Form de evaluación: estrellas (1-5) + comentario + ¿recomendarías?
export function ReviewForm({ service, onSubmit, onCancel }: {
  service: ReviewableService; onSubmit: (d: ReviewInput) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [rec, setRec] = useState(true);
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ rating, comment, wouldRecommend: rec, routeStopId: service.id }); }} className="space-y-3 rounded-lg border border-primary bg-card p-3">
      <p className="font-bold text-foreground">{service.serviceType || t("pService")}</p>
      <StarRating value={rating} onChange={setRating} />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder={t("pComment")} className={fld} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rec} onChange={(e) => setRec(e.target.checked)} className="h-4 w-4" />{t("pRecommendQ")}</label>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
