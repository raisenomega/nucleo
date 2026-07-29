import type { TranslationKey } from "./translations.keys";

// Namespace Stripe (STRIPE-1 Fase 1 · métodos de pago).
export const esStripe = {
  stripePayments: "Métodos de pago",
  stripeIntro: "Acepta pagos con tarjeta conectando tu cuenta Stripe. NÚCLEO no cobra comisión adicional — solo pagas las tarifas de Stripe (2.9% + $0.30). Tus claves se guardan cifradas.",
  stripePk: "Publishable key (pk_...)",
  stripeSk: "Secret key (sk_...) — se cifra al guardar",
  stripeWh: "Webhook secret (whsec_...) — opcional",
  stripeSaveValidate: "Validar y guardar",
  stripeConnected: "Conectado",
  stripeNotValidated: "Sin validar",
  stripeAccount: "Cuenta",
  stripeRevalidate: "Revalidar",
  stripeEditKeys: "Editar claves",
  stripeNextSteps: "Próximo: sincronizar catálogo y activar el cobro con tarjeta en facturas y órdenes.",
  stripeValidateFail: "Las claves se guardaron pero Stripe no las validó. Revisa que sean correctas.",
} satisfies Partial<Record<TranslationKey, string>>;
