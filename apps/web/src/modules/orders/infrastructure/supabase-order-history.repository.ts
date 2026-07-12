import { supabase } from "@shared/lib/supabase";
import { toHistoryEvent, type HistoryRow } from "@orders/infrastructure/order.mapper";
import type { IOrderHistoryRepository } from "@orders/domain/order-status-history.types";

export const supabaseOrderHistoryRepository: IOrderHistoryRepository = {
  async list(orderId: string) {
    const { data } = await supabase.from("order_status_history")
      .select("id,from_status,to_status,note,created_at,changed_by").eq("order_id", orderId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as HistoryRow[];
    const ids = [...new Set(rows.map((r) => r.changed_by).filter(Boolean))] as string[];
    const names: Record<string, string> = {};
    if (ids.length) {
      const { data: pr } = await supabase.from("profiles").select("id,full_name").in("id", ids);
      ((pr ?? []) as { id: string; full_name: string | null }[]).forEach((p) => { if (p.full_name) names[p.id] = p.full_name; });
    }
    return rows.map((r) => toHistoryEvent(r, r.changed_by ? (names[r.changed_by] ?? null) : null));
  },
};
