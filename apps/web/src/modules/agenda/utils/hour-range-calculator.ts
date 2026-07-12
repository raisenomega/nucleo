import type { WeeklySchedule } from "@agenda/domain/weekly-schedule.types";

const h = (t: string) => parseInt(t.slice(0, 2), 10);
const m = (t: string) => parseInt(t.slice(3, 5), 10);

// Rango horario visible del week-view: min(from)-1h .. max(to redondeado)+1h. Fallback 8-18 si no hay config.
export function visibleHourRange(ws: WeeklySchedule): [number, number] {
  let min = 24, max = 0;
  for (const day of Object.values(ws)) for (const r of day ?? []) {
    min = Math.min(min, h(r.from));
    max = Math.max(max, h(r.to) + (m(r.to) > 0 ? 1 : 0));
  }
  if (min > max) return [8, 18];
  return [Math.max(0, min - 1), Math.min(24, max + 1)];
}
