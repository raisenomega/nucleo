import type { AppointmentSettings } from "@agenda/domain/appointment-settings.types";
import type { WeeklySchedule } from "@agenda/domain/weekly-schedule.types";

export interface SettingsRow { timezone: string; buffer_minutes: number; weekly_schedule: WeeklySchedule | null; }
export const toSettings = (r: SettingsRow): AppointmentSettings =>
  ({ timezone: r.timezone, bufferMinutes: r.buffer_minutes, weeklySchedule: r.weekly_schedule ?? {} });
export const fromSettings = (tenantId: string, s: AppointmentSettings) =>
  ({ tenant_id: tenantId, timezone: s.timezone, buffer_minutes: s.bufferMinutes, weekly_schedule: s.weeklySchedule, updated_at: new Date().toISOString() });
