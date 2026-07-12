import type { Appointment } from "@agenda/domain/appointment.types";
import type { BlockedPeriod } from "@agenda/domain/blocked-period.types";

const overlaps = (aS: number, aE: number, bS: string, bE: string) => new Date(bS).getTime() < aE && new Date(bE).getTime() > aS;

// Chequeo client-side previo al drop (espeja save_appointment). Devuelve 'conflict' | 'blocked' | null.
export function slotConflict(startMs: number, endMs: number, appts: Appointment[], blocked: BlockedPeriod[], excludeId: string): "conflict" | "blocked" | null {
  for (const a of appts)
    if (a.id !== excludeId && (a.status === "agendada" || a.status === "confirmada") && overlaps(startMs, endMs, a.startsAt, a.endsAt)) return "conflict";
  for (const b of blocked) if (overlaps(startMs, endMs, b.startsAt, b.endsAt)) return "blocked";
  return null;
}
