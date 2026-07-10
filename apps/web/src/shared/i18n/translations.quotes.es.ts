import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (Cotizaciones). Se fusiona en translations.ts.
export const esQuotes = {
  quotesSubtitle: "Cotizaciones con flujo de aprobación — lead → cotización → factura → ingreso",
  newQuote: "Nueva cotización", quoteNumber: "N.º cotización", validUntil: "Válida hasta", terms: "Términos",
  markAccepted: "Marcar aceptada", markRejected: "Marcar rechazada", sendEmail: "Enviar email", totalQuoted: "Total cotizado",
  qsDraft: "Borrador", qsSent: "Enviada", qsViewed: "Vista", qsAccepted: "Aceptada",
  qsRejected: "Rechazada", qsExpired: "Expirada", qsConverted: "Convertida",
  sendQuote: "Enviar cotización", resendQuote: "Reenviar cotización", resend: "Reenviar", sending: "Enviando…",
  lastSentOn: "Última enviada el", editedAfterSent: "Editada después del último envío — el cliente tiene una versión vieja.",
  personalMessage: "Mensaje para el cliente (opcional)",
  noEmailWarning: "El cliente no tiene email registrado. Solo se enviará por WhatsApp.",
  noChannels: "No hay canales disponibles para el envío", sendError: "No se pudo enviar la cotización", sentOk: "Cotización enviada",
  loadingQuote: "Cargando cotización…", quoteLinkExpired: "El link expiró. Contacta a", quoteAlreadyResponded: "Esta cotización ya fue respondida.",
  quoteNotFound: "Cotización no encontrada.", tooManyRequests: "Demasiadas solicitudes. Intenta más tarde.",
  viewAndRespond: "Ver y responder cotización", acceptQuote: "Aceptar", rejectQuote: "Rechazar", rejectReason: "Motivo (opcional)",
  quoteAcceptedThanks: "¡Cotización aceptada! Gracias.", quoteRejectedThanks: "Cotización rechazada. Gracias por tu respuesta.",
  pdfNotAvailable: "PDF no disponible temporalmente. Contacta a", respondError: "No se pudo registrar tu respuesta. Intenta de nuevo.",
} satisfies Partial<Record<TranslationKey, string>>;
