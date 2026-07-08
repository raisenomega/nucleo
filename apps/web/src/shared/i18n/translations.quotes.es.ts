import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (Cotizaciones). Se fusiona en translations.ts.
export const esQuotes = {
  quotesSubtitle: "Cotizaciones con flujo de aprobación — lead → cotización → factura → ingreso",
  newQuote: "Nueva cotización", quoteNumber: "N.º cotización", validUntil: "Válida hasta", terms: "Términos",
  markAccepted: "Marcar aceptada", markRejected: "Marcar rechazada", sendEmail: "Enviar email", totalQuoted: "Total cotizado",
  qsDraft: "Borrador", qsSent: "Enviada", qsViewed: "Vista", qsAccepted: "Aceptada",
  qsRejected: "Rechazada", qsExpired: "Expirada", qsConverted: "Convertida",
} satisfies Partial<Record<TranslationKey, string>>;
