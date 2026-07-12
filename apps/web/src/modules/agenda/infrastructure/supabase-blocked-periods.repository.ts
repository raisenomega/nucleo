import { supabase } from "@shared/lib/supabase";
import { toBlocked, fromBlocked, type BlockedRow } from "@agenda/infrastructure/blocked-period.mapper";
import type { IBlockedPeriodsRepository, Result } from "@agenda/domain/blocked-period.types";

const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });
const SEL = "id,starts_at,ends_at,reason,is_full_day";

export const supabaseBlockedPeriodsRepository: IBlockedPeriodsRepository = {
  async list() {
    const { data } = await supabase.from("blocked_periods").select(SEL).order("starts_at");
    return ((data ?? []) as BlockedRow[]).map(toBlocked);
  },
  async create(tenantId, input) { return ok((await supabase.from("blocked_periods").insert(fromBlocked(tenantId, input))).error); },
  async remove(id) { return ok((await supabase.from("blocked_periods").delete().eq("id", id)).error); },
};
