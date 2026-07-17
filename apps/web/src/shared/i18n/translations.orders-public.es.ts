import type { TranslationKey } from "./translations.keys";

export const esOrdersPublic = {
  opTitle: "Ordenar", opPayment: "Método de pago", opSubtotal: "Subtotal", opTax: "Impuesto", opShipping: "Envío", opTotal: "Total",
  opCoupon: "Cupón", opDiscount: "Descuento", opCouponApplied: "Cupón aplicado — Ahorras {amount}", opCouponInvalid: "Cupón inválido o expirado", opCouponRemove: "Quitar", opCouponApply: "Aplicar", opSubmit: "Confirmar orden", opSubmitting: "Enviando…",
  opSuccess: "¡Orden recibida!", opSuccessMsg: "Un representante te contactará en menos de 24 horas para coordinar el pago y la entrega.", opClose: "Cerrar",
  opErrForm: "Revisá los campos del formulario.", opErrTotal: "El total no coincide. Recargá e intentá de nuevo.",
  opErrRate: "Demasiados intentos. Esperá un momento.", opErrCoupon: "Cupón inválido.", opErrPayment: "Método de pago no disponible.",
  opErrNetwork: "No se pudo enviar la orden.", opOrderBtn: "Ordenar", opSubscribeBtn: "Suscribirme",
  opCopyDetails: "Copiar detalles", opAthSent: "Ya envié el pago", opUnderstood: "Entendido",
  opAthThanks: "¡Gracias! Verificaremos tu pago y confirmaremos por email en menos de 24 horas.",
  checkoutRequiredField: "Completá los campos obligatorios para continuar.", viewTermsLink: "Ver",
  opSummaryTitle: "Resumen del Pedido", opCancel: "Cancelar",
  promoPriceLine: "Línea de precio (header)", promoSummaryLine: "Línea principal del resumen", promoIncludedLine: "Línea 'incluido'",
  promoIncludedLabelField: "Valor 'incluido'", promoTotalLabelField: "Label del total", promoRecurringNote: "Nota recurrente",
  promoTermsLabelField: "Label del link de términos", promoTermsText: "Texto de términos y condiciones", promoSecHeader: "Header de la oferta",
  promoSecSummary: "Resumen del pedido", promoSecTerms: "Términos y condiciones", promoIncluded: "Incluido",
  promoTotalToday: "Total hoy", promoAcceptPrefix: "Al enviar, acepto los", promoTermsDefault: "Términos y condiciones de la oferta",
} satisfies Partial<Record<TranslationKey, string>>;
