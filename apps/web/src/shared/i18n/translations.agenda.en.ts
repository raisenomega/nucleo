import type { TranslationKey } from "./translations.keys";

export const enAgenda = {
  agendaTitle: "Scheduling", agendaAvailability: "Availability", agendaBlocks: "Blocks", agendaReservableServices: "Bookable services",
  agendaTimezone: "Timezone", agendaBuffer: "Minutes between appointments", agendaAddWindow: "Add window", agendaAddBlock: "Add block",
  agendaAllDay: "All day", agendaNoBlocks: "No blocks", agendaBlockReason: "Reason", agendaFrom: "From", agendaTo: "To",
  agendaReserveNone: "Not bookable", agendaReserveFree: "Free booking", agendaReserveDeposit: "Deposit", agendaReserveFull: "Full payment",
  agendaNoReservable: "No bookable services", agendaNoReservableHint: "Mark services with 'Requires booking' to see them here.",
} satisfies Partial<Record<TranslationKey, string>>;
