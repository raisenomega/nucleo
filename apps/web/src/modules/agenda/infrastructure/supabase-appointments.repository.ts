import { supabase } from "@shared/lib/supabase";
import { toAppointment, type AptRow } from "@agenda/infrastructure/appointment.mapper";
import type { IAppointmentsRepository, AppointmentInput, Result } from "@agenda/domain/appointment.types";

const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });
const SEL = "id,lead_id,service_id,title,starts_at,ends_at,status,notes,meeting_link,notify_client,leads(contact_name,email),tenant_landing_services(name)";

export const supabaseAppointmentsRepository: IAppointmentsRepository = {
  async list(status) {
    let q = supabase.from("appointments").select(SEL).order("starts_at", { ascending: false });
    if (status && status !== "all") q = q.eq("status", status);
    const { data } = await q;
    return ((data ?? []) as unknown as AptRow[]).map(toAppointment);
  },
  async save(id, input) {
    const p = { lead_id: input.leadId, service_id: input.serviceId, title: input.title, starts_at: input.startsAt, ends_at: input.endsAt, status: input.status, notes: input.notes, meeting_link: input.meetingLink, notify_client: input.notifyClient };
    const { data } = await supabase.rpc("save_appointment", { p_id: id, p });
    const d = data as { status?: string; code?: string } | null;
    return d?.status === "ok" ? { ok: true } : { ok: false, code: d?.code };
  },
  async remove(id) { return ok((await supabase.from("appointments").delete().eq("id", id)).error); },
};
