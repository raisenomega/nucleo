import type { WeeklySchedule } from "@agenda/domain/weekly-schedule.types";

export type Result = { ok: true } | { ok: false; error: string };
export interface AppointmentSettings { timezone: string; bufferMinutes: number; weeklySchedule: WeeklySchedule; }
export interface IAppointmentSettingsRepository {
  get(): Promise<AppointmentSettings | null>;
  save(tenantId: string, s: AppointmentSettings): Promise<Result>;
}
