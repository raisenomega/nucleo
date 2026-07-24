import { supabase } from "@shared/lib/supabase";

// Ola 2.8c · lectura del dashboard de plataforma (get_platform_analytics, solo superadmin, tenant sentinela).
export interface PlatformAnalytics {
  traffic: {
    visits: number; visitors: number; sessions: number;
    byDay: { day: string; visits: number }[]; topPages: { path: string; views: number }[];
    sources: { source: string; count: number }[]; devices: Record<string, number>;
  };
  funnel: { visits: number; leads: number; demos: number; visitToLead: number; leadToDemo: number };
  ai: {
    crawls: number; trendPct: number | null; crawlsByBot: { bot: string; count: number; last: string }[];
    byResource: { resource: string; count: number }[]; referrals: number;
    referralsBySource: { source: string; count: number }[]; referralConversions: number;
  };
  campaigns: { campaign: string; visits: number; leads: number }[];
}
type J = Record<string, unknown>;
const arr = (v: unknown) => (Array.isArray(v) ? v : []) as J[];
const N = (v: unknown) => Number(v ?? 0);

export async function getPlatformAnalytics(days: number): Promise<PlatformAnalytics | null> {
  const { data } = await supabase.rpc("get_platform_analytics", { _days: days });
  if (!data || (data as J).error) return null;
  const t = ((data as J).traffic ?? {}) as J, f = ((data as J).funnel ?? {}) as J, a = ((data as J).ai ?? {}) as J;
  return {
    traffic: {
      visits: N(t.visits), visitors: N(t.visitors), sessions: N(t.sessions),
      byDay: arr(t.by_day).map((r) => ({ day: (r.day as string) ?? "", visits: N(r.visits) })),
      topPages: arr(t.top_pages).map((r) => ({ path: (r.path as string) ?? "/", views: N(r.views) })),
      sources: arr(t.sources).map((r) => ({ source: (r.source as string) ?? "—", count: N(r.count) })),
      devices: (t.devices as Record<string, number>) ?? {},
    },
    funnel: { visits: N(f.visits), leads: N(f.leads), demos: N(f.demos), visitToLead: N(f.visit_to_lead), leadToDemo: N(f.lead_to_demo) },
    ai: {
      crawls: N(a.crawls), trendPct: a.trend_pct == null ? null : N(a.trend_pct), referrals: N(a.referrals), referralConversions: N(a.referral_conversions),
      crawlsByBot: arr(a.crawls_by_bot).map((r) => ({ bot: (r.bot as string) ?? "—", count: N(r.count), last: (r.last as string) ?? "" })),
      byResource: arr(a.by_resource).map((r) => ({ resource: (r.resource as string) ?? "?", count: N(r.count) })),
      referralsBySource: arr(a.referrals_by_source).map((r) => ({ source: (r.source as string) ?? "—", count: N(r.count) })),
    },
    campaigns: arr((data as J).campaigns).map((r) => ({ campaign: (r.campaign as string) ?? "—", visits: N(r.visits), leads: N(r.leads) })),
  };
}
