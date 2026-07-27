// BC hr — asistencia (clock-in/out, horas, tardanzas). Puro.
export type AttendanceStatus = "active" | "completed" | "adjusted" | "voided";
export type AttResult = { ok: true } | { ok: false; error: string };

export interface AttendanceRecord {
  readonly id: string; readonly employeeId: string; readonly employeeName: string;
  readonly clockIn: string; readonly clockInLat: number | null; readonly clockInLng: number | null;
  readonly clockOut: string | null; readonly clockOutLat: number | null; readonly clockOutLng: number | null;
  readonly hoursWorked: number | null; readonly hoursRegular: number | null; readonly hoursOvertime: number | null;
  readonly status: AttendanceStatus; readonly isLate: boolean; readonly lateMinutes: number; readonly workDate: string;
}
export interface EmployeeAttendanceSummary {
  readonly employeeId: string; readonly name: string; readonly totalHours: number; readonly regularHours: number;
  readonly overtimeHours: number; readonly daysWorked: number; readonly daysLate: number;
}
export interface AttendanceSummary {
  readonly totalHours: number; readonly regularHours: number; readonly overtimeHours: number;
  readonly daysWorked: number; readonly daysLate: number; readonly avgHoursPerDay: number;
}
export interface AttendanceConfig {
  workStartTime: string; workEndTime: string; dailyHoursLimit: number; weeklyHoursLimit: number;
  overtimeMultiplier: number; graceMinutes: number; autoCheckoutEnabled: boolean; autoCheckoutAfterHours: number; requireGps: boolean;
}

export interface IAttendanceRepository {
  clockIn(lat: number | null, lng: number | null): Promise<AttResult>;
  clockOut(lat: number | null, lng: number | null): Promise<AttResult>;
  getMyActive(userId: string): Promise<AttendanceRecord | null>;
  list(employeeId: string | null, from: string, to: string): Promise<AttendanceRecord[]>;
  getSummary(employeeId: string, from: string, to: string): Promise<AttendanceSummary | null>;
  getTeamSummary(from: string, to: string): Promise<EmployeeAttendanceSummary[]>;
  adjust(id: string, clockIn: string | null, clockOut: string | null, reason: string): Promise<AttResult>;
  getConfig(): Promise<AttendanceConfig | null>;
  updateConfig(d: AttendanceConfig, tenantId: string): Promise<AttResult>;
}
