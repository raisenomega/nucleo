import type { TranslationKey } from "@shared/i18n";
import type { LeaveStatus } from "@hr/domain/leave.types";

export const LS_KEY: Record<LeaveStatus, TranslationKey> = {
  pending: "lsPending", approved: "lsApproved", rejected: "lsRejected", cancelled: "lsCancelled",
};
export const LS_COLOR: Record<LeaveStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  cancelled: "bg-secondary text-muted-foreground",
};

// Días hábiles (lun-vie) inclusivos entre dos fechas ISO (yyyy-mm-dd).
export function businessDays(start: string, end: string): number {
  if (!start || !end || end < start) return 0;
  let c = 0; const e = new Date(end);
  for (const d = new Date(start); d <= e; d.setDate(d.getDate() + 1)) { const w = d.getDay(); if (w !== 0 && w !== 6) c++; }
  return c;
}

// Color del disponible: >50% verde, 25-50% ámbar, <25% rojo (sobre el acumulado).
export const balanceTone = (available: number, accrued: number): string => {
  const pct = accrued > 0 ? available / accrued : 1;
  return pct > 0.5 ? "text-green-600" : pct >= 0.25 ? "text-amber-600" : "text-destructive";
};
