import { supabase } from "@shared/lib/supabase";
import type { CustomerService, CustomerAppointment } from "@shared/portal/service.types";

type Row = Record<string, unknown>;
const arrLen = (v: unknown) => (Array.isArray(v) ? v.length : 0);
const toService = (r: Row): CustomerService => ({ id: r.id as string, serviceType: (r.service_type as string) ?? "", status: (r.status as string) ?? "", completedAt: (r.completed_at as string) ?? null, notes: (r.notes as string) ?? "", address: (r.address as string) ?? "", evidenceCount: arrLen(r.evidence_before) + arrLen(r.evidence_after) });
const toAppt = (r: Row): CustomerAppointment => ({ id: r.id as string, title: (r.title as string) ?? "", startsAt: (r.starts_at as string) ?? "", endsAt: (r.ends_at as string) ?? "", status: (r.status as string) ?? "", meetingLink: (r.meeting_link as string) ?? "" });

// RLS: route_stops por teléfono del perfil; appointments por email del lead. Solo devuelven lo del cliente.
export async function listServices(tenantId: string): Promise<CustomerService[]> {
  const { data } = await supabase.from("route_stops").select("id, service_type, status, completed_at, notes, address, evidence_before, evidence_after")
    .eq("tenant_id", tenantId).is("deleted_at", null).order("completed_at", { ascending: false, nullsFirst: false });
  return ((data as Row[] | null) ?? []).map(toService);
}
export async function listAppointments(tenantId: string): Promise<CustomerAppointment[]> {
  const { data } = await supabase.from("appointments").select("id, title, starts_at, ends_at, status, meeting_link").eq("tenant_id", tenantId).order("starts_at", { ascending: false });
  return ((data as Row[] | null) ?? []).map(toAppt);
}
async function apptAct(fn: string, args: object): Promise<boolean> {
  const { data, error } = await supabase.rpc(fn, args);
  return !error && (data as { status?: string } | null)?.status === "ok";
}
export const rescheduleAppointment = (id: string, starts: string, ends: string) => apptAct("customer_reschedule_appointment", { _id: id, _starts: starts, _ends: ends });
export const cancelAppointment = (id: string) => apptAct("customer_cancel_appointment", { _id: id });
