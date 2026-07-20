// Disponibilidad (config única) + fecha bloqueada + reserva. La landing lee config/slots + crea reservas vía
// RPC; los editores /web/disponibilidad y /web/reservas gestionan config, bloqueos y reservas.
export interface AvailabilityConfig {
  id: string; timezone: string; durationMinutes: number; bufferMinutes: number; maxPerDay: number;
  availableDays: number[]; hoursStart: string; hoursEnd: string;
  titleEs: string; titleEn: string; subtitleEs: string; subtitleEn: string; confirmEs: string; confirmEn: string;
  confSubjectEs: string; confSubjectEn: string; confBodyEs: string; confBodyEn: string;
}
// startTime/endTime null = día completo bloqueado; con valores = solo esa franja [start, end).
export interface BlockedDate { id: string; blockedDate: string; reason: string; startTime: string | null; endTime: string | null }
export type ReservationStatus = "confirmed" | "cancelled" | "completed" | "no_show";
export interface MarketingReservation {
  id: string; customerName: string; customerEmail: string; customerPhone: string | null;
  reservationDate: string; reservationTime: string; durationMinutes: number;
  status: ReservationStatus; notes: string | null; createdAt: string;
}
export interface ReservationSubmit { customerName: string; customerEmail: string; customerPhone: string; message: string; reservationDate: string; reservationTime: string; lang: string }
