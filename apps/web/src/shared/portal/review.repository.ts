import { supabase } from "@shared/lib/supabase";
import type { CustomerReview, ReviewableService, ReviewInput } from "@shared/portal/review.types";

type Row = Record<string, unknown>;
const toReview = (r: Row): CustomerReview => ({ id: r.id as string, rating: Number(r.rating ?? 0), comment: (r.comment as string) ?? "", wouldRecommend: (r.would_recommend as boolean | null) ?? null, createdAt: (r.created_at as string) ?? "", reply: (r.reply as string) ?? "", routeStopId: (r.route_stop_id as string) ?? null });

export async function listReviews(tenantId: string): Promise<CustomerReview[]> {
  const { data } = await supabase.from("customer_reviews").select("id, rating, comment, would_recommend, created_at, reply, route_stop_id").eq("tenant_id", tenantId).order("created_at", { ascending: false });
  return ((data as Row[] | null) ?? []).map(toReview);
}
export async function listCompletedServices(tenantId: string): Promise<ReviewableService[]> {
  const { data } = await supabase.from("route_stops").select("id, service_type, completed_at").eq("tenant_id", tenantId).eq("status", "Completada").is("deleted_at", null).order("completed_at", { ascending: false });
  return ((data as Row[] | null) ?? []).map((r) => ({ id: r.id as string, serviceType: (r.service_type as string) ?? "", completedAt: (r.completed_at as string) ?? null }));
}
export async function createReview(tenantId: string, customerProfileId: string, d: ReviewInput): Promise<boolean> {
  const { error } = await supabase.from("customer_reviews").insert({ tenant_id: tenantId, customer_profile_id: customerProfileId, route_stop_id: d.routeStopId, rating: d.rating, comment: d.comment || null, would_recommend: d.wouldRecommend });
  return !error;
}
