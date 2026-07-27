import { supabase } from "@shared/lib/supabase";
import type { ILeaveRepository, LeaveType, LeaveBalance, LeaveRequest, CalendarAbsence, LeaveRequestData } from "@hr/domain/leave.types";
import type { AttResult } from "@hr/domain/attendance.types";

const ok = (e: { message: string } | null): AttResult => (e ? { ok: false, error: e.message } : { ok: true });
const nm = (v: unknown): string => (v as { name: string; color: string } | null)?.name ?? "—";
const cl = (v: unknown): string => (v as { name: string; color: string } | null)?.color ?? "royalblue";
const RSEL = "id,employee_id,leave_type_id,start_date,end_date,days_requested,is_half_day,status,reason,rejection_reason,created_at,leave_types:leave_type_id(name,color),profiles:employee_id(full_name)";

export const supabaseLeaveRepository: ILeaveRepository = {
  async getTypes(): Promise<LeaveType[]> {
    const { data } = await supabase.from("leave_types").select("id,name,code,is_paid,accrual_type,accrual_rate,max_balance,carry_over,requires_approval,color,is_active").eq("is_active", true).order("name");
    return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({ id: r.id as string, name: r.name as string, code: r.code as string,
      isPaid: !!r.is_paid, accrualType: r.accrual_type as string, accrualRate: Number(r.accrual_rate ?? 0), maxBalance: r.max_balance != null ? Number(r.max_balance) : null,
      carryOver: !!r.carry_over, requiresApproval: !!r.requires_approval, color: r.color as string, isActive: !!r.is_active }));
  },
  async getBalances(employeeId, year): Promise<LeaveBalance[]> {
    let q = supabase.from("leave_balances").select("id,employee_id,leave_type_id,year,accrued,used,pending,available,leave_types:leave_type_id(name,color),profiles:employee_id(full_name)").eq("year", year);
    if (employeeId) q = q.eq("employee_id", employeeId);
    const { data } = await q;
    return ((data as unknown as Record<string, unknown>[] | null) ?? []).map((r) => ({ id: r.id as string, employeeId: r.employee_id as string,
      employeeName: (r.profiles as { full_name: string } | null)?.full_name ?? "—", leaveTypeId: r.leave_type_id as string, leaveTypeName: nm(r.leave_types), leaveTypeColor: cl(r.leave_types),
      year: Number(r.year), accrued: Number(r.accrued), used: Number(r.used), pending: Number(r.pending), available: Number(r.available) }));
  },
  async getRequests(employeeId, status): Promise<LeaveRequest[]> {
    let q = supabase.from("leave_requests").select(RSEL);
    if (employeeId) q = q.eq("employee_id", employeeId);
    if (status) q = q.eq("status", status);
    const { data } = await q.order("created_at", { ascending: false });
    return ((data as unknown as Record<string, unknown>[] | null) ?? []).map((r) => ({ id: r.id as string, employeeId: r.employee_id as string,
      employeeName: (r.profiles as { full_name: string } | null)?.full_name ?? "—", leaveTypeId: r.leave_type_id as string, leaveTypeName: nm(r.leave_types), leaveTypeColor: cl(r.leave_types),
      startDate: r.start_date as string, endDate: r.end_date as string, daysRequested: Number(r.days_requested), isHalfDay: !!r.is_half_day,
      status: r.status as LeaveRequest["status"], reason: (r.reason as string) ?? null, rejectionReason: (r.rejection_reason as string) ?? null, createdAt: r.created_at as string }));
  },
  async requestLeave(d: LeaveRequestData) {
    return ok((await supabase.rpc("request_leave", { p_leave_type_id: d.leaveTypeId, p_start_date: d.startDate, p_end_date: d.endDate,
      p_reason: d.reason || null, p_is_half_day: d.isHalfDay, p_half_day_period: d.halfDayPeriod })).error);
  },
  async approve(id) { return ok((await supabase.rpc("approve_leave", { p_request_id: id })).error); },
  async reject(id, reason) { return ok((await supabase.rpc("reject_leave", { p_request_id: id, p_reason: reason || null })).error); },
  async cancel(id) { return ok((await supabase.rpc("cancel_leave", { p_request_id: id })).error); },
  async getTeamCalendar(month, year): Promise<CalendarAbsence[]> {
    const { data } = await supabase.rpc("get_team_calendar", { p_month: month, p_year: year });
    return ((data as Record<string, unknown>[] | null) ?? []).map((a) => ({ employeeName: a.employee_name as string, leaveType: a.leave_type as string,
      color: a.color as string, startDate: a.start_date as string, endDate: a.end_date as string }));
  },
};
