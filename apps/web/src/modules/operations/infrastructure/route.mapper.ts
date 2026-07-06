import type { ServiceRoute, RouteStop, StopFormData, StopPatch } from "@operations/domain/route.types";

export type RRow = { id: string; route_date: string; assigned_to: string; status: string; notes: string | null; created_by: string; route_stops: { count: number }[] };
export type SRow = { id: string; route_id: string; stop_order: number; client_name: string; address: string; city: string | null; service_type: string; scheduled_time: string; estimated_amount: number | string; actual_amount: number | string | null; payment_method_id: string | null; status: string; notes: string | null; completed_at: string | null };

export const toRoute = (r: RRow): ServiceRoute => ({
  id: r.id, routeDate: r.route_date, assignedTo: r.assigned_to, status: r.status,
  notes: r.notes, createdBy: r.created_by, stopCount: r.route_stops?.[0]?.count ?? 0,
});
export const toStop = (s: SRow): RouteStop => ({
  id: s.id, routeId: s.route_id, stopOrder: s.stop_order, clientName: s.client_name,
  address: s.address, city: s.city, serviceType: s.service_type, scheduledTime: s.scheduled_time,
  estimatedAmount: Number(s.estimated_amount), actualAmount: s.actual_amount == null ? null : Number(s.actual_amount),
  paymentMethodId: s.payment_method_id, status: s.status, notes: s.notes, completedAt: s.completed_at,
});
export const stopRow = (routeId: string, order: number, s: StopFormData) => ({
  route_id: routeId, stop_order: order, client_name: s.clientName, address: s.address,
  city: s.city || null, service_type: s.serviceType, scheduled_time: s.scheduledTime,
  estimated_amount: s.estimatedAmount, notes: s.notes || null,
});
export function stopPatch(p: StopPatch): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => { if (v !== undefined) r[k] = v; };
  set("client_name", p.clientName); set("address", p.address); set("city", p.city ?? undefined);
  set("service_type", p.serviceType); set("scheduled_time", p.scheduledTime);
  set("estimated_amount", p.estimatedAmount); set("status", p.status);
  set("notes", p.notes); set("completed_at", p.completedAt);
  return r;
}
