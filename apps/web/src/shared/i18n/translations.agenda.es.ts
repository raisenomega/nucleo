import type { TranslationKey } from "./translations.keys";

export const esAgenda = {
  agendaTitle: "Agenda", agendaAvailability: "Disponibilidad", agendaBlocks: "Bloqueos", agendaReservableServices: "Servicios reservables",
  agendaTimezone: "Zona horaria", agendaBuffer: "Minutos entre citas", agendaAddWindow: "Agregar ventana", agendaAddBlock: "Agregar bloqueo",
  agendaAllDay: "Todo el día", agendaNoBlocks: "Sin bloqueos", agendaBlockReason: "Motivo", agendaFrom: "Desde", agendaTo: "Hasta",
  agendaReserveNone: "No reservable", agendaReserveFree: "Reserva gratis", agendaReserveDeposit: "Depósito", agendaReserveFull: "Pago completo",
  agendaNoReservable: "No hay servicios agendables", agendaNoReservableHint: "Marcá servicios con 'Requiere agenda' para que aparezcan aquí.",
  agendaNewAppointment: "Nueva cita", agendaNoAppointments: "Sin citas", agendaLeadSearch: "Buscar cliente…", agendaNewLead: "Crear nuevo cliente",
  agendaLeadName: "Nombre", agendaLeadPhone: "Teléfono", agendaLeadEmail: "Email", agendaService: "Servicio", agendaStartsAt: "Inicio",
  agendaDuration: "Duración (min)", agendaStatus: "Estado", agendaNotes: "Notas", agendaConfig: "Configuración", agendaFilterAll: "Todas",
  agendaStatusAgendada: "Agendada", agendaStatusConfirmada: "Confirmada", agendaStatusCompletada: "Completada", agendaStatusCancelada: "Cancelada", agendaStatusNoShow: "No asistió",
  agendaErrConflict: "Ya hay una cita en ese horario", agendaErrBlocked: "Ese horario está bloqueado", agendaErrSave: "No se pudo guardar la cita",
  agendaViewList: "Lista", agendaViewWeek: "Semana", agendaViewMonth: "Mes",
  agendaDowMon: "Lun", agendaDowTue: "Mar", agendaDowWed: "Mié", agendaDowThu: "Jue", agendaDowFri: "Vie", agendaDowSat: "Sáb", agendaDowSun: "Dom",
  agendaPrevWeek: "Semana anterior", agendaNextWeek: "Semana siguiente", agendaToday: "Hoy", agendaPrevMonth: "Mes anterior", agendaNextMonth: "Mes siguiente",
  agendaRescheduled: "Cita reagendada", agendaUndo: "Deshacer", agendaApptTitle: "Título", agendaNewService: "Crear servicio",
} satisfies Partial<Record<TranslationKey, string>>;
