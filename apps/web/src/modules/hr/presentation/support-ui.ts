import type { TranslationKey } from "@shared/i18n";
import type { Priority, TicketStatus } from "@hr/domain/support.types";

export const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];
export const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
export const PRIO_KEY: Record<Priority, TranslationKey> = { low: "prioLow", normal: "prioNormal", high: "prioHigh", urgent: "prioUrgent" };
export const PRIO_COLOR: Record<Priority, string> = {
  low: "bg-secondary", normal: "bg-blue-100 text-blue-800", high: "bg-amber-100 text-amber-800", urgent: "bg-red-100 text-red-800",
};
export const TST_KEY: Record<TicketStatus, TranslationKey> = { open: "tkOpen", in_progress: "tkInProgress", resolved: "tkResolved", closed: "tkClosed" };
export const TST_COLOR: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-800", in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800", closed: "bg-secondary",
};
