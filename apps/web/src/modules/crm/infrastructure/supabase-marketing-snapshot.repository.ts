import { supabase } from "@shared/lib/supabase";
import type { MarketingSnapshot, IMarketingSnapshotRepository } from "@crm/domain/marketing.types";

interface Raw {
  total_budget: number; total_spent: number; executed_pct: number;
  leads_generated: number; converted: number; cac: number; roi: number;
}

export const supabaseMarketingSnapshotRepository: IMarketingSnapshotRepository = {
  async getSnapshot(month: string): Promise<MarketingSnapshot | null> {
    const args = month ? { p_month: `${month}-01` } : {};
    const { data, error } = await supabase.rpc("get_marketing_snapshot", args);
    if (error || !data) return null;
    const r = data as unknown as Raw;
    return {
      totalBudget: Number(r.total_budget), totalSpent: Number(r.total_spent),
      executedPct: Number(r.executed_pct), leadsGenerated: Number(r.leads_generated),
      converted: Number(r.converted), cac: Number(r.cac), roi: Number(r.roi),
    };
  },
};
