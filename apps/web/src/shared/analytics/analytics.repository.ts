import { supabase } from "@shared/lib/supabase";

// Ola 2.8a/b · lectura del dashboard de analytics del tenant (get_landing_analytics, últimos N días).
export interface AiVisibility {
  crawls: number; crawlsByBot: { bot: string; count: number; last: string }[];
  referrals: number; referralsBySource: { source: string; count: number }[]; referralConversions: number;
}
export interface LandingAnalytics {
  visits: number; visitors: number; sessions: number; conversions: number;
  topPages: { path: string; views: number }[]; sources: { source: string; count: number }[];
  byDay: { day: string; visits: number }[]; conversionsByType: Record<string, number>; ai: AiVisibility;
}
type J = Record<string, unknown>;
const arr = (v: unknown) => (Array.isArray(v) ? v : []) as J[];
const N = (v: unknown) => Number(v ?? 0);

export async function getLandingAnalytics(days: number): Promise<LandingAnalytics | null> {
  const { data } = await supabase.rpc("get_landing_analytics", { _days: days });
  if (!data) return null;
  const d = data as J;
  const a = (d.ai ?? {}) as J;
  return {
    visits: N(d.visits), visitors: N(d.visitors), sessions: N(d.sessions), conversions: N(d.conversions),
    topPages: arr(d.top_pages).map((r) => ({ path: (r.path as string) ?? "/", views: N(r.views) })),
    sources: arr(d.sources).map((r) => ({ source: (r.source as string) ?? "—", count: N(r.count) })),
    byDay: arr(d.by_day).map((r) => ({ day: (r.day as string) ?? "", visits: N(r.visits) })),
    conversionsByType: (d.conversions_by_type as Record<string, number>) ?? {},
    ai: {
      crawls: N(a.crawls), referrals: N(a.referrals), referralConversions: N(a.referral_conversions),
      crawlsByBot: arr(a.crawls_by_bot).map((r) => ({ bot: (r.bot as string) ?? "—", count: N(r.count), last: (r.last as string) ?? "" })),
      referralsBySource: arr(a.referrals_by_source).map((r) => ({ source: (r.source as string) ?? "—", count: N(r.count) })),
    },
  };
}
