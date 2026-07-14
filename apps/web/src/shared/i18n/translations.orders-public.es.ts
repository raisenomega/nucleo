import type { TranslationKey } from "./translations.keys";

export const esOrdersPublic = {
  opTitle: "Ordenar", opPayment: "Método de pago", opSubtotal: "Subtotal", opTax: "Impuesto", opShipping: "Envío", opTotal: "Total",
  opCoupon: "Cupón", opCouponApply: "Aplicar", opSubmit: "Confirmar orden", opSubmitting: "Enviando…",
  opSuccess: "¡Orden recibida!", opSuccessMsg: "Un representante te contactará en menos de 24 horas para coordinar el pago y la entrega.", opClose: "Cerrar",
  opErrForm: "Revisá los campos del formulario.", opErrTotal: "El total no coincide. Recargá e intentá de nuevo.",
  opErrRate: "Demasiados intentos. Esperá un momento.", opErrCoupon: "Cupón inválido.", opErrPayment: "Método de pago no disponible.",
  opErrNetwork: "No se pudo enviar la orden.", opOrderBtn: "Ordenar", opSubscribeBtn: "Suscribirme",
  opCopyDetails: "Copiar detalles", opAthSent: "Ya envié el pago", opUnderstood: "Entendido",
  opAthThanks: "¡Gracias! Verificaremos tu pago y confirmaremos por email en menos de 24 horas.",
  checkoutRequiredField: "Completá los campos obligatorios para continuar.", viewTermsLink: "Ver",
  opSummaryTitle: "Resumen del Pedido", opCancel: "Cancelar",
} satisfies Partial<Record<TranslationKey, string>>;
