// Portal P4 — evaluaciones del cliente + servicios evaluables (completados sin reseña).
export interface CustomerReview {
  readonly id: string; readonly rating: number; readonly comment: string; readonly wouldRecommend: boolean | null;
  readonly createdAt: string; readonly reply: string; readonly routeStopId: string | null;
}
export interface ReviewableService { readonly id: string; readonly serviceType: string; readonly completedAt: string | null }
export interface ReviewInput { rating: number; comment: string; wouldRecommend: boolean; routeStopId: string | null }
