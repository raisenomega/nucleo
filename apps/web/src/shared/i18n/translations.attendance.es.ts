import type { TranslationKey } from "./translations.keys";

// Diccionario de asistencia + vacaciones (RRHH-5). Se fusiona en translations.ts.
export const esAttendance = {
  attendance: "Asistencia", attendanceConfig: "Configuración", today: "Hoy", working: "Trabajando",
  clockIn: "Entrada", clockOut: "Salida", hoursWorked: "Horas", markEntry: "Marcar Entrada", markExit: "Marcar Salida",
  lateArrival: "Tardanza", records: "registros", completed: "Completado", thisWeek: "Esta semana", thisMonth: "Este mes",
  allEmployees: "Todos", totalHours: "Total horas", regularHours: "Regular", overtimeHours: "Overtime", daysWorked: "Días",
  adjust: "Ajustar", adjustAttendance: "Ajustar registro", adjustmentReason: "Razón del ajuste",
  workStart: "Inicio jornada", workEnd: "Fin jornada", dailyLimit: "Horas diarias", weeklyLimit: "Horas semanales",
  overtimeMultiplier: "Multiplicador overtime", graceMinutes: "Minutos de gracia", autoCheckout: "Auto-salida", requireGps: "Requerir GPS",
  leave: "Vacaciones", requestLeave: "Solicitar ausencia", leaveType: "Tipo", halfDay: "Medio día", morning: "Mañana", afternoon: "Tarde",
  daysRequested: "Días", insufficientBalance: "Balance insuficiente", sendRequest: "Enviar solicitud",
  lsPending: "Pendiente", lsApproved: "Aprobada", lsRejected: "Rechazada", lsCancelled: "Cancelada",
  myRequests: "Mis solicitudes", pendingApproval: "Pendientes", leaveBalance: "Balances", teamCalendar: "Calendario",
  rejectionReason: "Razón del rechazo", noAbsences: "Nadie ausente este mes",
} satisfies Partial<Record<TranslationKey, string>>;
