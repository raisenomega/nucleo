import { supabase } from "@shared/lib/supabase";
import type { RepoResult, IRouteRepository } from "@operations/domain/route.types";
import { toRoute, toStop, stopRow, stopPatch, type RRow, type SRow } from "@operations/infrastructure/route.mapper";

const ok = (e: { message: string } | null): RepoResult => (e ? { ok: false, error: e.message } : { ok: true });
const ROUTE_SEL = "id,route_date,assigned_to,status,notes,created_by, route_stops(status)";

export const supabaseRouteRepository: IRouteRepository = {
  async recordPayment(stopId, p) {
    return ok((await supabase.rpc("record_stop_payment", { p_stop_id: stopId, p_amount: p.amount,
      p_payment_method_id: p.paymentMethodId || null, p_received: p.received, p_change: p.change, p_evidence: p.evidence })).error);
  },
  async setNotAttended(stopId, reason) { return ok((await supabase.rpc("set_stop_not_attended", { p_stop_id: stopId, p_reason: reason })).error); },
  async listRoutes(date) {
    const { data } = await supabase.from("service_routes").select(ROUTE_SEL)
      .eq("route_date", date).is("deleted_at", null).order("created_at");
    return ((data as RRow[] | null) ?? []).map(toRoute);
  },
  async listStops(routeId) {
    const { data } = await supabase.from("route_stops").select("*").eq("route_id", routeId).order("stop_order");
    return ((data as SRow[] | null) ?? []).map(toStop);
  },
  async create(d, stops) {
    const { data, error } = await supabase.from("service_routes")
      .insert({ route_date: d.routeDate, assigned_to: d.assignedTo, status: d.status, notes: d.notes || null }).select("id").single();
    if (error) return { ok: false, error: error.message };
    if (stops.length) {
      const e = (await supabase.from("route_stops").insert(stops.map((s, i) => stopRow((data as { id: string }).id, i + 1, s)))).error;
      if (e) return { ok: false, error: e.message };
    }
    return { ok: true };
  },
  async update(id, d) {
    return ok((await supabase.from("service_routes")
      .update({ route_date: d.routeDate, assigned_to: d.assignedTo, status: d.status, notes: d.notes || null }).eq("id", id)).error);
  },
  async remove(id) {
    return ok((await supabase.from("service_routes").update({ deleted_at: new Date().toISOString() }).eq("id", id)).error);
  },
  async addStop(routeId, order, s) { return ok((await supabase.from("route_stops").insert(stopRow(routeId, order, s))).error); },
  async updateStop(id, patch) { return ok((await supabase.from("route_stops").update(stopPatch(patch)).eq("id", id)).error); },
  async removeStop(id) { return ok((await supabase.from("route_stops").delete().eq("id", id)).error); },
  async reorderStops(ids) {
    for (let i = 0; i < ids.length; i++) {
      const e = (await supabase.from("route_stops").update({ stop_order: i + 1 }).eq("id", ids[i])).error;
      if (e) return { ok: false, error: e.message };
    }
    return { ok: true };
  },
  async recordSupplies(stopId, items) {
    return ok((await supabase.rpc("record_stop_supplies", { p_stop_id: stopId,
      p_items: items.map((i) => ({ item_id: i.itemId, quantity: i.quantity })) })).error);
  },
  async listSupplies(stopId) {
    const { data } = await supabase.rpc("get_stop_supplies", { p_stop_id: stopId });
    return ((data as { item_id: string; name: string; quantity: number }[] | null) ?? [])
      .map((r) => ({ itemId: r.item_id, name: r.name, quantity: Number(r.quantity) }));
  },
};
