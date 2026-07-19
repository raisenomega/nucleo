import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { StarRatingDisplay } from "@landing-public/presentation/StarRatingDisplay";
import { replyReview } from "@shared/customers/customer-crm.repository";
import type { DossierReview } from "@shared/customers/customer-dossier";

// Sección Evaluaciones + responder (guarda en customer_reviews.reply, solo CEO por RLS).
export function CustomerReviewsAdmin({ reviews, onChanged }: { reviews: DossierReview[]; onChanged: () => void }) {
  const { t } = useI18n();
  const [replying, setReplying] = useState<string | null>(null); const [text, setText] = useState("");
  const save = async (id: string) => { const ok = await replyReview(id, text); if (ok) { setReplying(null); setText(""); onChanged(); } };
  return (
    <div className="space-y-2 border-t border-border pt-2">
      <p className="text-xs font-bold uppercase text-muted-foreground">{t("cReviews")}</p>
      {reviews.length === 0 && <p className="text-sm text-muted-foreground">{t("pNoReviews")}</p>}
      {reviews.map((r) => (
        <div key={r.id} className="space-y-1 rounded-lg border border-border p-2 text-sm">
          <div className="flex justify-between"><StarRatingDisplay value={r.rating} /><span className="text-xs text-muted-foreground">{r.createdAt.slice(0, 10)}</span></div>
          {r.comment && <p>{r.comment}</p>}
          {r.reply ? <p className="rounded bg-secondary p-1.5"><span className="font-bold">{t("pBusinessReply")}: </span>{r.reply}</p>
            : replying === r.id ? <div className="flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded border border-border bg-background p-1.5" /><button type="button" onClick={() => void save(r.id)} className="rounded bg-primary px-2 text-xs font-bold text-primary-foreground">{t("cSendReply")}</button></div>
              : <button type="button" onClick={() => { setReplying(r.id); setText(""); }} className="text-xs font-bold text-primary">{t("cReply")}</button>}
        </div>
      ))}
    </div>
  );
}
