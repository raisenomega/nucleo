import { supabase } from "@shared/lib/supabase";
import type {
  IAttendanceRepository, AttendanceRecord, AttendanceSummary, EmployeeAttendanceSummary, AttendanceConfig, AttResult,
} from "@hr/domain/attendance.types";

const ok = (e: { message: string } | null): AttResult => (e ? { ok: false, error: e.message } : { ok: true });
const num = (v: unknown): number | null => (v != null ? Number(v) : null);
const ASEL = "id,employee_id,clock_in,clock_in_lat,clock_in_lng,clock_out,clock_out_lat,clock_out_lng,hours_worked,hours_regular,hours_overtime,status,is_late,late_minutes,work_date,profiles:employee_id(full_name)";

const toRec = (r: Record<string, unknown>): AttendanceRecord => ({
  id: r.id as string, employeeId: r.employee_id as string, employeeName: (r.profiles as { full_name: string } | null)?.full_name ?? "—",
  clockIn: r.clock_in as string, clockInLat: num(r.clock_in_lat), clockInLng: num(r.clock_in_lng),
  clockOut: (r.clock_out as string) ?? null, clockOutLat: num(r.clock_out_lat), clockOutLng: num(r.clock_out_lng),
  hoursWorked: num(r.hours_worked), hoursRegular: num(r.hours_regular), hoursOvertime: num(r.hours_overtime),
  status: r.status as AttendanceRecord["status"], isLate: !!r.is_late, lateMinutes: Number(r.late_minutes ?? 0), workDate: r.work_date as string,
});

export const supabaseAttendanceRepository: IAttendanceRepository = {
  async clockIn(lat, lng) { return ok((await supabase.rpc("clock_in", { p_lat: lat, p_lng: lng, p_method: "web" })).error); },
  async clockOut(lat, lng) { return ok((await supabase.rpc("clock_out", { p_lat: lat, p_lng: lng, p_method: "web" })).error); },
  async getMyActive(userId) {
    const { data } = await supabase.from("employee_attendance").select(ASEL).eq("employee_id", userId).eq("status", "active").limit(1);
    const rows = (data as unknown as Record<string, unknown>[] | null) ?? [];
    return rows[0] ? toRec(rows[0]) : null;
  },
  async list(employeeId, from, to) {
    let q = supabase.from("employee_attendance").select(ASEL).gte("work_date", from).lte("work_date", to).neq("status", "voided");
    if (employeeId) q = q.eq("employee_id", employeeId);
    const { data } = await q.order("work_date", { ascending: false }).order("clock_in", { ascending: false });
    return ((data as unknown as Record<string, unknown>[] | null) ?? []).map(toRec);
  },
  async getSummary(employeeId, from, to) {
    const { data } = await supabase.rpc("get_attendance_summary", { p_employee_id: employeeId, p_from: from, p_to: to });
    const d = data as Record<string, unknown> | null;
    if (!d) return null;
    return { totalHours: Number(d.total_hours ?? 0), regularHours: Number(d.regular_hours ?? 0), overtimeHours: Number(d.overtime_hours ?? 0),
      daysWorked: Number(d.days_worked ?? 0), daysLate: Number(d.days_late ?? 0), avgHoursPerDay: Number(d.avg_hours_per_day ?? 0) };
  },
  async getTeamSummary(from, to): Promise<EmployeeAttendanceSummary[]> {
    const { data } = await supabase.rpc("get_attendance_summary", { p_employee_id: null, p_from: from, p_to: to });
    return ((data as Record<string, unknown>[] | null) ?? []).map((d) => ({ employeeId: d.employee_id as string, name: d.name as string,
      totalHours: Number(d.total_hours ?? 0), regularHours: Number(d.regular_hours ?? 0), overtimeHours: Number(d.overtime_hours ?? 0),
      daysWorked: Number(d.days_worked ?? 0), daysLate: Number(d.days_late ?? 0) }));
  },
  async adjust(id, clockIn, clockOut, reason) {
    return ok((await supabase.rpc("adjust_attendance", { p_attendance_id: id, p_clock_in: clockIn, p_clock_out: clockOut, p_reason: reason })).error);
  },
  async getConfig(): Promise<AttendanceConfig | null> {
    const { data } = await supabase.from("attendance_config").select("*").limit(1).maybeSingle();
    const d = data as Record<string, unknown> | null;
    if (!d) return null;
    return { workStartTime: (d.work_start_time as string)?.slice(0, 5) ?? "08:00", workEndTime: (d.work_end_time as string)?.slice(0, 5) ?? "17:00",
      dailyHoursLimit: Number(d.daily_hours_limit ?? 8), weeklyHoursLimit: Number(d.weekly_hours_limit ?? 40), overtimeMultiplier: Number(d.overtime_multiplier ?? 1.5),
      graceMinutes: Number(d.grace_minutes ?? 15), autoCheckoutEnabled: !!d.auto_checkout_enabled, autoCheckoutAfterHours: Number(d.auto_checkout_after_hours ?? 12), requireGps: !!d.require_gps };
  },
  async updateConfig(d, tenantId) {
    return ok((await supabase.from("attendance_config").upsert({ tenant_id: tenantId, work_start_time: d.workStartTime, work_end_time: d.workEndTime,
      daily_hours_limit: d.dailyHoursLimit, weekly_hours_limit: d.weeklyHoursLimit, overtime_multiplier: d.overtimeMultiplier,
      grace_minutes: d.graceMinutes, auto_checkout_enabled: d.autoCheckoutEnabled, auto_checkout_after_hours: d.autoCheckoutAfterHours,
      require_gps: d.requireGps }, { onConflict: "tenant_id" })).error);
  },
};
