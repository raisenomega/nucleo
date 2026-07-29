import type { TranslationKey } from "./translations.keys";

// Stripe namespace (STRIPE-1 Phase 1 · payment methods).
export const enStripe = {
  stripePayments: "Payment methods",
  stripeIntro: "Accept card payments by connecting your Stripe account. NÚCLEO takes no extra fee — you only pay Stripe's rates (2.9% + $0.30). Your keys are stored encrypted.",
  stripePk: "Publishable key (pk_...)",
  stripeSk: "Secret key (sk_...) — encrypted on save",
  stripeWh: "Webhook secret (whsec_...) — optional",
  stripeSaveValidate: "Validate and save",
  stripeConnected: "Connected",
  stripeNotValidated: "Not validated",
  stripeAccount: "Account",
  stripeRevalidate: "Revalidate",
  stripeEditKeys: "Edit keys",
  stripeNextSteps: "Next: sync your catalog and enable card payments on invoices and orders.",
  stripeValidateFail: "Keys were saved but Stripe could not validate them. Check they are correct.",
} satisfies Partial<Record<TranslationKey, string>>;
