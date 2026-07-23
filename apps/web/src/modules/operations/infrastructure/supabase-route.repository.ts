import { supabase } from "@shared/lib/supabase";
import type { RepoResult, IRouteRepository } from "@operations/domain/route.types";
import { toRoute, toStop, stopRow, stopPatch, type RRow, type SRow } from "@operations/infrastructure/route.mapper";

const ok = (e: { message: string } | null): RepoResult => (e ? { ok: false, error: e.message } : { ok: true });
const ROUTE_SEL = "id,route_date,assigned_to,status,notes,created_by,asset_id,deleted_at,deleted_by,deleted_reason, asset:tenant_assets(name), route_stops(status,deleted_at)";

export const supabaseRouteRepository: IRouteRepository = {
  async recordPayment(stopId, p) {
    return ok((await supabase.rpc("record_stop_payment", { p_stop_id: stopId, p_amount: p.amount,
      p_payment_method_id: p.paymentMethodId || null, p_received: p.received, p_change: p.change, p_evidence: p.evidence })).error);
  },
  async completeStop(stopId) { return ok((await supabase.rpc("complete_route_stop", { p_stop_id: stopId })).error); },
  // Via RPC definer (guard: routes.edit O creador O asignado): el UPDATE directo lo bloqueaba RLS en
  // silencio para empleados con override granular sin routes.edit (migr 216).
  async saveStopEvidence(stopId, phase, paths) { return ok((await supabase.rpc("save_stop_evidence", { p_stop_id: stopId, p_phase: phase, p_paths: paths })).error); },
  async setNotAttended(stopId, reason) { return ok((await supabase.rpc("set_stop_not_attended", { p_stop_id: stopId, p_reason: reason })).error); },
  async listRoutes(date) {
    // Incluye anuladas (deleted_at != null) — se muestran tachadas en la tabla (auditoría).
    const { data } = await supabase.from("service_routes").select(ROUTE_SEL)
      .eq("route_date", date).order("created_at");
    return ((data as RRow[] | null) ?? []).map(toRoute);
  },
  async listStops(routeId) {
    const { data } = await supabase.from("route_stops").select("*").eq("route_id", routeId).order("stop_order");
    return ((data as SRow[] | null) ?? []).map(toStop);
  },
  async create(d, stops) {
    // upsert_route (120): atómico append-on-create. Si ya hay ruta del día+empleado, agrega stops
    // a la existente (RLS 117 + unique index son el guard). NO manda status (se deriva).
    const e = (await supabase.rpc("upsert_route", {
      p_date: d.routeDate, p_assigned_to: d.assignedTo, p_notes: d.notes,
      p_stops: stops.map((s) => ({
        client_name: s.clientName, address: s.address, city: s.city || null, service_type: s.serviceType,
        scheduled_time: s.scheduledTime, estimated_amount: s.estimatedAmount, notes: s.notes || null, phone: s.phone || null, customer_id: s.customerId || null,
      })),
    })).error;
    // Vehículo asignado: update directo post-RPC (no toca upsert_route). Casa por día+empleado (unique index).
    if (!e && d.assetId) await supabase.from("service_routes").update({ asset_id: d.assetId }).eq("route_date", d.routeDate).eq("assigned_to", d.assignedTo).is("deleted_at", null);
    return ok(e);
  },
  async update(id, d) {
    return ok((await supabase.from("service_routes")
      .update({ route_date: d.routeDate, assigned_to: d.assignedTo, notes: d.notes || null, asset_id: d.assetId || null }).eq("id", id)).error);
  },
  async voidRow(id, reason) {
    return ok((await supabase.rpc("void_route", { p_id: id, p_reason: reason })).error);
  },
  async remove(id) {   // hard delete (solo CEO, sobre rutas ya anuladas)
    return ok((await supabase.from("service_routes").delete().eq("id", id)).error);
  },
  async addStop(routeId, order, s) { return ok((await supabase.from("route_stops").insert(stopRow(routeId, order, s))).error); },
  async updateStop(id, patch) { // .select() destapa el bloqueo silencioso de RLS (error=null y 0 filas)
    const { data, error } = await supabase.from("route_stops").update(stopPatch(patch)).eq("id", id).select("id");
    return error ? { ok: false, error: error.message } : data?.length ? { ok: true } : { ok: false, error: "Sin permiso para editar esta parada" };
  },
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
