import type { TranslationKey } from "./translations.keys";

export const enAgenda = {
  agendaTitle: "Scheduling", agendaAvailability: "Availability", agendaBlocks: "Blocks", agendaReservableServices: "Bookable services",
  agendaTimezone: "Timezone", agendaBuffer: "Minutes between appointments", agendaAddWindow: "Add window", agendaAddBlock: "Add block",
  agendaAllDay: "All day", agendaNoBlocks: "No blocks", agendaBlockReason: "Reason", agendaFrom: "From", agendaTo: "To",
  agendaReserveNone: "Not bookable", agendaReserveFree: "Free booking", agendaReserveDeposit: "Deposit", agendaReserveFull: "Full payment",
  agendaNoReservable: "No bookable services", agendaNoReservableHint: "Mark services with 'Requires booking' to see them here.",
  agendaNewAppointment: "New appointment", agendaNoAppointments: "No appointments", agendaLeadSearch: "Search client…", agendaNewLead: "Create new client",
  agendaLeadName: "Name", agendaLeadPhone: "Phone", agendaLeadEmail: "Email", agendaService: "Service", agendaStartsAt: "Start",
  agendaDuration: "Duration (min)", agendaStatus: "Status", agendaNotes: "Notes", agendaConfig: "Settings", agendaFilterAll: "All",
  agendaStatusAgendada: "Scheduled", agendaStatusConfirmada: "Confirmed", agendaStatusCompletada: "Completed", agendaStatusCancelada: "Cancelled", agendaStatusNoShow: "No-show",
  agendaErrConflict: "There's already an appointment at that time", agendaErrBlocked: "That time is blocked", agendaErrSave: "Couldn't save the appointment",
  agendaViewList: "List", agendaViewWeek: "Week", agendaViewMonth: "Month",
  agendaDowMon: "Mon", agendaDowTue: "Tue", agendaDowWed: "Wed", agendaDowThu: "Thu", agendaDowFri: "Fri", agendaDowSat: "Sat", agendaDowSun: "Sun",
  agendaPrevWeek: "Previous week", agendaNextWeek: "Next week", agendaToday: "Today", agendaPrevMonth: "Previous month", agendaNextMonth: "Next month",
  agendaRescheduled: "Appointment rescheduled", agendaUndo: "Undo", agendaApptTitle: "Title", agendaNewService: "Create service",
} satisfies Partial<Record<TranslationKey, string>>;
