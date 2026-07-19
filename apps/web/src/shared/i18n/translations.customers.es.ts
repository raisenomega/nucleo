import type { TranslationKey } from "./translations.keys";

// Vista CRM admin de clientes del portal. Se fusiona en translations.ts.
export const esCustomers = {
  cTotalCustomers: "Total clientes", cActive30: "Activos (30d)", cTotalBilled: "Total facturado", cAvgRating: "Evaluación prom.",
  cOrders: "Órdenes", cBilled: "Facturado", cLastOrder: "Última orden", cRating: "Evaluación",
  cActiveSt: "Activo", cInactiveSt: "Inactivo", cWithDebt: "Con deuda",
  cNoCustomers: "Aún no tienes clientes registrados", cRegisterHint: "Los clientes se registran en tu portal (tudominio.com/portal).",
  cProfile: "Perfil", cInvoices: "Facturas", cServices: "Servicios", cTickets: "Tickets", cReviews: "Evaluaciones",
  cReply: "Responder", cSendReply: "Enviar", cDeactivate: "Desactivar cuenta", cActivate: "Reactivar cuenta",
  cInternalNote: "Nota interna", cRegisteredOn: "Registrado", cNoOrders: "Sin órdenes",
} satisfies Partial<Record<TranslationKey, string>>;
