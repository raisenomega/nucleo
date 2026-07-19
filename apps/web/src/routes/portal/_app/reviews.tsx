import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { usePortal } from "@shared/portal/portal-context";
import { useCustomerReviews } from "@shared/portal/useCustomerReviews.hook";
import { ReviewForm } from "@shared/portal/ReviewForm";
import { ReviewCard } from "@shared/portal/ReviewCard";
import type { ReviewInput } from "@shared/portal/review.types";

export const Route = createFileRoute("/portal/_app/reviews")({ component: PortalReviews });

function PortalReviews() {
  const { t } = useI18n();
  const { customer } = usePortal();
  const r = useCustomerReviews(customer.tenantId, customer.id);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const submit = (d: ReviewInput) => void r.create(d).then(() => setReviewing(null));
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("navReviews")}</h1>
      {r.pending.length > 0 && <div className="space-y-2">
        <p className="text-sm font-bold uppercase text-muted-foreground">{t("pToReview")}</p>
        {r.pending.map((s) => reviewing === s.id
          ? <ReviewForm key={s.id} service={s} onSubmit={submit} onCancel={() => setReviewing(null)} />
          : <button key={s.id} type="button" onClick={() => setReviewing(s.id)} className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 text-left"><span className="font-medium">{s.serviceType || t("pService")}</span><span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{t("pEvaluate")}</span></button>)}
      </div>}
      <p className="text-sm font-bold uppercase text-muted-foreground">{t("pMyReviews")}</p>
      {r.reviews.length === 0 && <p className="text-sm text-muted-foreground">{t("pNoReviews")}</p>}
      {r.reviews.map((rv) => <ReviewCard key={rv.id} review={rv} />)}
    </div>
  );
}
