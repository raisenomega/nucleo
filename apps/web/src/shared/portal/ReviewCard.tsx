import { useI18n } from "@shared/i18n";
import { StarRatingDisplay } from "@landing-public/presentation/StarRatingDisplay";
import type { CustomerReview } from "@shared/portal/review.types";

// Evaluación previa: estrellas + comentario + respuesta del negocio (si la hay).
export function ReviewCard({ review }: { review: CustomerReview }) {
  const { t } = useI18n();
  return (
    <div className="space-y-1 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <StarRatingDisplay value={review.rating} />
        <span className="text-xs text-muted-foreground">{review.createdAt.slice(0, 10)}</span>
      </div>
      {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
      {review.reply && <p className="rounded bg-secondary p-2 text-sm"><span className="font-bold">{t("pBusinessReply")}: </span>{review.reply}</p>}
    </div>
  );
}
