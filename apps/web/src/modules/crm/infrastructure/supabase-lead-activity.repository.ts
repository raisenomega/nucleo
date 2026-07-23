import { supabase } from "@shared/lib/supabase";
import type { ActivityKind, LeadActivity, PendingFollowup } from "@crm/domain/lead-activity.types";

type Res = { ok: true } | { ok: false; error: string };
type J = Record<string, unknown>;
const jarr = (v: unknown) => (Array.isArray(v) ? v : []) as J[];
const res = (e: { message: string } | null): Res => (e ? { ok: false, error: e.message } : { ok: true });

export const supabaseLeadActivityRepository = {
  async list(leadId: string): Promise<LeadActivity[]> {
    const { data } = await supabase.from("lead_activities").select("id, lead_id, kind, body, due_date, done_at, created_at")
      .eq("lead_id", leadId).order("created_at", { ascending: false });
    return ((data as unknown as J[] | null) ?? []).map((r) => ({
      id: r.id as string, leadId: r.lead_id as string, kind: r.kind as ActivityKind, body: (r.body as string) ?? "",
      dueDate: (r.due_date as string) ?? null, doneAt: (r.done_at as string) ?? null, createdAt: r.created_at as string,
    }));
  },
  async add(leadId: string, kind: ActivityKind, body: string, dueDate?: string): Promise<Res> {
    return res((await supabase.rpc("add_lead_activity", { _payload: { lead_id: leadId, kind, body, due_date: dueDate ?? null } })).error);
  },
  async complete(id: string): Promise<Res> { return res((await supabase.rpc("complete_lead_activity", { _id: id })).error); },
  async remove(id: string): Promise<Res> { return res((await supabase.rpc("delete_lead_activity", { _id: id })).error); },
  async pendingFollowups(): Promise<PendingFollowup[]> {
    const { data } = await supabase.rpc("get_pending_followups");
    return jarr(data).map((r) => ({ activityId: r.activity_id as string, leadId: r.lead_id as string,
      contactName: (r.contact_name as string) ?? "—", body: (r.body as string) ?? "", dueDate: r.due_date as string, bucket: r.bucket as PendingFollowup["bucket"] }));
  },
  // Registro automático best-effort: nunca lanza (no debe bloquear la acción principal — email/status/contacto).
  async logSilently(leadId: string, kind: ActivityKind, body: string): Promise<void> {
    try { await supabase.rpc("add_lead_activity", { _payload: { lead_id: leadId, kind, body, due_date: null } }); } catch { /* ignore */ }
  },
};
