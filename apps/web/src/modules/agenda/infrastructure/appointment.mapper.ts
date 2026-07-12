import type { Appointment, AppointmentStatus } from "@agenda/domain/appointment.types";

type Rel = { contact_name?: string; name?: string } | { contact_name?: string; name?: string }[] | null;
export interface AptRow {
  id: string; lead_id: string | null; service_id: string | null; title: string; starts_at: string;
  ends_at: string; status: AppointmentStatus; notes: string | null; leads: Rel; tenant_landing_services: Rel;
}
const one = (v: Rel) => (Array.isArray(v) ? v[0] : v);
export const toAppointment = (r: AptRow): Appointment => ({
  id: r.id, leadId: r.lead_id, serviceId: r.service_id, title: r.title, startsAt: r.starts_at,
  endsAt: r.ends_at, status: r.status, notes: r.notes ?? "",
  leadName: one(r.leads)?.contact_name ?? null, serviceName: one(r.tenant_landing_services)?.name ?? null,
});
