import type { ReservationStatus } from "@raisen-marketing/data/reservation.types";

// Estados de la reserva (labels ES + colores para el inbox /web/reservas).
export const RES_STATUSES: ReservationStatus[] = ["confirmed", "cancelled", "completed", "no_show"];
export const RES_LABELS: Record<ReservationStatus, string> = {
  confirmed: "Confirmada", cancelled: "Cancelada", completed: "Completada", no_show: "No asistió",
};
export const RES_COLORS: Record<ReservationStatus, string> = {
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  no_show: "bg-red-500/20 text-red-400 border-red-500/30",
};
