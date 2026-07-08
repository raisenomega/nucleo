import { supabase } from "@shared/lib/supabase";
import type { IObservationRepository, Observation, ObsCategory, ObsResult } from "@hr/domain/observation.types";

interface Row {
  id: string; employee_id: string; category: string; notes: string;
  requires_follow_up: boolean; follow_up_date: string | null; created_at: string; profiles: { full_name: string } | null;
}
const SEL = "id,employee_id,category,notes,requires_follow_up,follow_up_date,created_at,profiles:employee_id(full_name)";
const toObs = (r: Row): Observation => ({
  id: r.id, employeeId: r.employee_id, employeeName: r.profiles?.full_name ?? "—",
  category: r.category as ObsCategory, notes: r.notes, requiresFollowUp: r.requires_follow_up,
  followUpDate: r.follow_up_date, createdAt: r.created_at,
});
const ok = (e: { message: string } | null): ObsResult => (e ? { ok: false, error: e.message } : { ok: true });

export const supabaseObservationRepository: IObservationRepository = {
  async list(): Promise<Observation[]> {
    const { data } = await supabase.from("observations").select(SEL).order("created_at", { ascending: false });
    return ((data as unknown as Row[] | null) ?? []).map(toObs);
  },
  async listForEmployee(employeeId): Promise<Observation[]> {
    const { data } = await supabase.from("observations").select(SEL).eq("employee_id", employeeId).order("created_at", { ascending: false });
    return ((data as unknown as Row[] | null) ?? []).map(toObs);
  },
  async save(employeeId, category, notes, followUp): Promise<ObsResult> {
    return ok((await supabase.rpc("save_observation", {
      p_employee_id: employeeId, p_category: category, p_notes: notes, p_follow_up: followUp || null,
    })).error);
  },
  async remove(id): Promise<ObsResult> {
    return ok((await supabase.from("observations").delete().eq("id", id)).error);
  },
};
