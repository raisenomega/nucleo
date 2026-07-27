// BC hr — vacaciones/ausencias. Puro.
import type { AttResult } from "@hr/domain/attendance.types";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveType {
  readonly id: string; readonly name: string; readonly code: string; readonly isPaid: boolean;
  readonly accrualType: string; readonly accrualRate: number; readonly maxBalance: number | null;
  readonly carryOver: boolean; readonly requiresApproval: boolean; readonly color: string; readonly isActive: boolean;
}
export interface LeaveBalance {
  readonly id: string; readonly employeeId: string; readonly employeeName: string;
  readonly leaveTypeId: string; readonly leaveTypeName: string; readonly leaveTypeColor: string;
  readonly year: number; readonly accrued: number; readonly used: number; readonly pending: number; readonly available: number;
}
export interface LeaveRequest {
  readonly id: string; readonly employeeId: string; readonly employeeName: string;
  readonly leaveTypeId: string; readonly leaveTypeName: string; readonly leaveTypeColor: string;
  readonly startDate: string; readonly endDate: string; readonly daysRequested: number; readonly isHalfDay: boolean;
  readonly status: LeaveStatus; readonly reason: string | null; readonly rejectionReason: string | null; readonly createdAt: string;
}
export interface CalendarAbsence {
  readonly employeeName: string; readonly leaveType: string; readonly color: string;
  readonly startDate: string; readonly endDate: string;
}
export interface LeaveRequestData {
  leaveTypeId: string; startDate: string; endDate: string; reason: string; isHalfDay: boolean; halfDayPeriod: string | null;
}

export interface ILeaveRepository {
  getTypes(): Promise<LeaveType[]>;
  getBalances(employeeId: string | null, year: number): Promise<LeaveBalance[]>;
  getRequests(employeeId: string | null, status: string | null): Promise<LeaveRequest[]>;
  requestLeave(d: LeaveRequestData): Promise<AttResult>;
  approve(id: string): Promise<AttResult>;
  reject(id: string, reason: string): Promise<AttResult>;
  cancel(id: string): Promise<AttResult>;
  getTeamCalendar(month: number, year: number): Promise<CalendarAbsence[]>;
}
