import { supabase } from "@shared/lib/supabase";
import type { AssetBookValue, DepreciationEntry } from "@assets/domain/asset.types";

type J = Record<string, unknown>;
const jarr = (v: unknown) => (Array.isArray(v) ? v : []) as J[];
const N = Number;

// 2.7a · depreciación calculada (informativa). book_value = purchase_price − Σ asientos; current_value no se toca.
export const supabaseDepreciationRepository = {
  async bookValues(): Promise<Record<string, AssetBookValue>> {
    const { data } = await supabase.rpc("get_asset_book_values");
    const map: Record<string, AssetBookValue> = {};
    for (const r of jarr(data)) map[r.asset_id as string] = {
      assetId: r.asset_id as string, purchasePrice: N(r.purchase_price), salvageValue: N(r.salvage_value),
      accumulated: N(r.accumulated), bookValue: N(r.book_value), currentValue: r.current_value == null ? null : N(r.current_value),
      monthly: N(r.monthly), monthsRemaining: N(r.months_remaining),
    };
    return map;
  },
  async entries(assetId: string): Promise<DepreciationEntry[]> {
    const { data } = await supabase.from("asset_depreciation_entries").select("period_year, period_month, amount, book_value_after")
      .eq("asset_id", assetId).order("period_year", { ascending: false }).order("period_month", { ascending: false });
    return ((data as unknown as J[] | null) ?? []).map((r) => ({ periodYear: N(r.period_year), periodMonth: N(r.period_month), amount: N(r.amount), bookValueAfter: N(r.book_value_after) }));
  },
  async recalc(assetId: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.rpc("backfill_asset_depreciation", { _asset_id: assetId });
    return error ? { ok: false, error: error.message } : { ok: true };
  },
};
