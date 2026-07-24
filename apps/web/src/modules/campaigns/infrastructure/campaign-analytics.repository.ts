import { supabase } from "@shared/lib/supabase";

// R4 · analytics de UNA campaña (tab de rendimiento del editor). Datos del motor de 2.8 (get_campaign_analytics,
// page-scoped + manager-gated). Visitas/fuentes salen de tenant_landing_analytics por path=/c/{slug}; leads del
// campaign_page_id en leads/marketing_leads. NO usa view_count/lead_count (obsoletos).
export interface CampaignAnalytics {
  visits: number; leads: number; conversions: number;
  byDay: { day: string; visits: number }[]; sources: { source: string; count: number }[];
}
type J = Record<string, unknown>;
const arr = (v: unknown) => (Array.isArray(v) ? v : []) as J[];
const N = (v: unknown) => Number(v ?? 0);

export async function getCampaignAnalytics(pageId: string, days: number): Promise<CampaignAnalytics | null> {
  const { data } = await supabase.rpc("get_campaign_analytics", { _page_id: pageId, _days: days });
  if (!data) return null;
  const d = data as J;
  return {
    visits: N(d.visits), leads: N(d.leads), conversions: N(d.conversions),
    byDay: arr(d.by_day).map((r) => ({ day: (r.day as string) ?? "", visits: N(r.visits) })),
    sources: arr(d.sources).map((r) => ({ source: (r.source as string) ?? "—", count: N(r.count) })),
  };
}
