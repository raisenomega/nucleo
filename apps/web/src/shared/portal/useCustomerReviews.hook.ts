import { useCallback, useEffect, useState } from "react";
import { listReviews, listCompletedServices, createReview } from "@shared/portal/review.repository";
import type { CustomerReview, ReviewableService, ReviewInput } from "@shared/portal/review.types";

// Evaluaciones del cliente + servicios completados pendientes de evaluar (completados − ya reseñados).
export function useCustomerReviews(tenantId: string, profileId: string) {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [completed, setCompleted] = useState<ReviewableService[]>([]);
  const refresh = useCallback(async () => { setReviews(await listReviews(tenantId)); setCompleted(await listCompletedServices(tenantId)); }, [tenantId]);
  useEffect(() => { void refresh(); }, [refresh]);
  const reviewed = new Set(reviews.map((r) => r.routeStopId).filter(Boolean));
  const pending = completed.filter((s) => !reviewed.has(s.id));
  const create = useCallback(async (d: ReviewInput) => { const ok = await createReview(tenantId, profileId, d); if (ok) await refresh(); return ok; }, [tenantId, profileId, refresh]);
  return { reviews, pending, create };
}
