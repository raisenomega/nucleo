import { supabase } from "@shared/lib/supabase";
import type { MaintenancePlan, PlanFormData } from "@assets/domain/asset.types";

type J = Record<string, unknown>;
type Res = { ok: true } | { ok: false; error: string };
const jarr = (v: unknown) => (Array.isArray(v) ? v : []) as J[];
const N = (v: unknown) => (v == null ? null : Number(v));
const res = (e: { message: string } | null): Res => (e ? { ok: false, error: e.message } : { ok: true });

// 2.7b · planes de mantenimiento (estado tiempo/km) + completar (registra en asset_maintenance_log).
export const supabaseMaintenancePlanRepository = {
  async status(assetId: string): Promise<MaintenancePlan[]> {
    const { data } = await supabase.rpc("get_maintenance_status", { _asset_id: assetId });
    return jarr(data).map((r) => ({
      id: r.id as string, assetId: r.asset_id as string, name: (r.name as string) ?? "", recurrenceType: r.recurrence_type as "time" | "meter",
      intervalDays: N(r.interval_days), intervalKm: N(r.interval_km), lastDoneDate: (r.last_done_date as string) ?? null, lastDoneOdometer: N(r.last_done_odometer),
      alertDaysBefore: Number(r.alert_days_before ?? 7), alertKmBefore: Number(r.alert_km_before ?? 500), isActive: !!r.is_active, notes: (r.notes as string) ?? "",
      nextDueDate: (r.next_due_date as string) ?? null, daysUntil: N(r.days_until), currentOdometer: N(r.current_odometer), kmUntil: N(r.km_until),
      status: (r.status as MaintenancePlan["status"]) ?? "ok",
    }));
  },
  async upsert(d: PlanFormData): Promise<Res> {
    return res((await supabase.rpc("upsert_maintenance_plan", { _payload: {
      id: d.id || null, asset_id: d.assetId, name: d.name, recurrence_type: d.recurrenceType,
      interval_days: d.intervalDays, interval_km: d.intervalKm, last_done_date: d.lastDoneDate || null, last_done_odometer: d.lastDoneOdometer,
      alert_days_before: d.alertDaysBefore, alert_km_before: d.alertKmBefore, is_active: d.isActive, notes: d.notes,
    } })).error);
  },
  async remove(id: string): Promise<Res> { return res((await supabase.rpc("delete_maintenance_plan", { _id: id })).error); },
  async complete(planId: string, date: string, odometer: number | null, cost: number, notes: string): Promise<Res> {
    return res((await supabase.rpc("complete_maintenance_plan", { _plan_id: planId, _payload: { date, odometer, cost, notes } })).error);
  },
};
