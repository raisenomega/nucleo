import type { ServiceRoute, RouteStop, StopFormData, StopPatch } from "@operations/domain/route.types";

type SStat = { status: string; deleted_at: string | null };
export type RRow = { id: string; route_date: string; assigned_to: string; status: string; notes: string | null; created_by: string; route_stops: SStat[]; asset_id: string | null; asset: { name: string } | null; deleted_at: string | null; deleted_by: string | null; deleted_reason: string | null };

// Estado del día DERIVADO de los stops (B.3.c/120). VOID excluidos; 'No atendido' (No cobrado)
// cuenta como completado. La columna service_routes.status queda vestigial (Camino 1).
// Follow-up: eliminar la columna DB si ningún otro consumer la lee.
const DONE = new Set(["Completada", "No atendido"]);
export const deriveDayStatus = (stops: SStat[]): string => {
  const active = stops.filter((s) => !s.deleted_at);
  if (active.length === 0) return "Planificada";
  if (active.every((s) => DONE.has(s.status))) return "Completada";
  if (active.every((s) => s.status === "Pendiente")) return "Planificada";
  return "En progreso";
};
export type SRow = { id: string; route_id: string; stop_order: number; client_name: string; address: string; city: string | null; service_type: string; scheduled_time: string; phone: string | null; customer_id: string | null; estimated_amount: number | string; actual_amount: number | string | null; payment_method_id: string | null; status: string; notes: string | null; completed_at: string | null; evidence_urls: string[] | null; amount_received: number | string | null; change_amount: number | string | null; pending_collection: boolean | null; evidence_before: string[] | null; evidence_after: string[] | null; lat: number | string | null; lng: number | string | null };
const num = (v: number | string | null) => (v == null ? null : Number(v));

export const toRoute = (r: RRow): ServiceRoute => {
  const active = (r.route_stops ?? []).filter((s) => !s.deleted_at);
  return {
    id: r.id, routeDate: r.route_date, assignedTo: r.assigned_to,
    status: deriveDayStatus(r.route_stops ?? []),   // derivado; ignora r.status (vestigial)
    notes: r.notes, createdBy: r.created_by, stopCount: active.length,
    completedCount: active.filter((s) => DONE.has(s.status)).length,   // Completada + No cobrado
    assetId: r.asset_id, assetName: r.asset?.name ?? "",
    deletedAt: r.deleted_at, deletedBy: r.deleted_by, deletedReason: r.deleted_reason,
  };
};
export const toStop = (s: SRow): RouteStop => ({
  id: s.id, routeId: s.route_id, stopOrder: s.stop_order, clientName: s.client_name,
  address: s.address, city: s.city, serviceType: s.service_type, scheduledTime: s.scheduled_time,
  phone: s.phone, customerId: s.customer_id, estimatedAmount: Number(s.estimated_amount), actualAmount: num(s.actual_amount),
  paymentMethodId: s.payment_method_id, status: s.status, notes: s.notes, completedAt: s.completed_at,
  evidenceUrls: s.evidence_urls ?? [], amountReceived: num(s.amount_received),
  changeAmount: num(s.change_amount), pendingCollection: !!s.pending_collection,
  evidenceBefore: s.evidence_before ?? [], evidenceAfter: s.evidence_after ?? [],
  lat: num(s.lat), lng: num(s.lng),
});
export const stopRow = (routeId: string, order: number, s: StopFormData) => ({
  route_id: routeId, stop_order: order, client_name: s.clientName, address: s.address,
  city: s.city || null, service_type: s.serviceType, scheduled_time: s.scheduledTime,
  phone: s.phone || null, customer_id: s.customerId || null, estimated_amount: s.estimatedAmount, notes: s.notes || null,
});
export function stopPatch(p: StopPatch): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => { if (v !== undefined) r[k] = v; };
  set("client_name", p.clientName); set("address", p.address); set("city", p.city ?? undefined);
  set("phone", p.phone ?? undefined); set("service_type", p.serviceType); set("scheduled_time", p.scheduledTime);
  set("estimated_amount", p.estimatedAmount); set("status", p.status);
  set("notes", p.notes); set("completed_at", p.completedAt); set("stop_order", p.stopOrder);
  set("evidence_urls", p.evidenceUrls);
  set("evidence_before", p.evidenceBefore); set("evidence_after", p.evidenceAfter);
  set("lat", p.lat); set("lng", p.lng);
  return r;
}
