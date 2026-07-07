import { supabase } from "@shared/lib/supabase";
import type { IAccountsReceivableRepository, ARSnapshot, ARResult } from "@finance/domain/accounts-receivable.types";

interface RawItem {
  stopId: string; clientName: string; phone: string | null;
  amount: number | string; routeDate: string; assignedTo: string; reason: string | null;
}
interface Raw { total_pending: number | string; count: number; items: RawItem[] | null }
const ok = (e: { message: string } | null): ARResult => (e ? { ok: false, error: e.message } : { ok: true });

export const supabaseArRepository: IAccountsReceivableRepository = {
  async getAll(month): Promise<ARSnapshot> {
    const { data } = await supabase.rpc("get_accounts_receivable", month ? { p_month: month } : {});
    const r = (data as Raw | null) ?? { total_pending: 0, count: 0, items: [] };
    return {
      totalPending: Number(r.total_pending), count: r.count,
      items: (r.items ?? []).map((i) => ({
        stopId: i.stopId, clientName: i.clientName, phone: i.phone, amount: Number(i.amount),
        routeDate: i.routeDate, assignedTo: i.assignedTo, reason: i.reason,
      })),
    };
  },
  async collectDebt(stopId, methodId) {
    return ok((await supabase.rpc("collect_pending_debt", { p_stop_id: stopId, p_method_id: methodId || null })).error);
  },
  async forgiveDebt(stopId, reason) {
    return ok((await supabase.from("route_stops").update({ pending_collection: false, notes: reason }).eq("id", stopId)).error);
  },
  async addNote(stopId, text) {
    const { data } = await supabase.from("route_stops").select("notes").eq("id", stopId).single();
    const prev = (data as { notes: string | null } | null)?.notes ?? "";
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const line = `[${stamp}] ${text}`;
    return ok((await supabase.from("route_stops").update({ notes: prev ? `${prev}\n${line}` : line }).eq("id", stopId)).error);
  },
};
