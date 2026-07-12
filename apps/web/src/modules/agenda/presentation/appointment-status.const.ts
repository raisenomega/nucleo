import type { TranslationKey } from "@shared/i18n";
import type { AppointmentStatus } from "@agenda/domain/appointment.types";

export const STATUS_LABEL: Record<AppointmentStatus, TranslationKey> = {
  agendada: "agendaStatusAgendada", confirmada: "agendaStatusConfirmada", completada: "agendaStatusCompletada",
  cancelada: "agendaStatusCancelada", "no-show": "agendaStatusNoShow",
};
export const STATUS_COLOR: Record<AppointmentStatus, string> = {
  agendada: "bg-gray-500", confirmada: "bg-blue-500", completada: "bg-green-500", cancelada: "bg-red-500/60", "no-show": "bg-orange-500",
};
export const STATUSES: AppointmentStatus[] = ["agendada", "confirmada", "completada", "cancelada", "no-show"];
