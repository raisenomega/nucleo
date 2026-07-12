// Horario semanal: por día, N ventanas from/to (soporta mañana+tarde). jsonb en appointment_settings.
export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];
export interface TimeRange { from: string; to: string; }
export type WeeklySchedule = Partial<Record<DayKey, TimeRange[]>>;
