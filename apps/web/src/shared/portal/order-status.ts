import type { TranslationKey } from "@shared/i18n";

// Estados de orden (puro): pasos del timeline, etiqueta i18n y color del badge.
export const ORDER_STEPS = ["pending", "awaiting_payment", "awaiting_confirmation", "paid"] as const;
export const STATUS_LABEL: Record<string, TranslationKey> = {
  pending: "osPending", awaiting_payment: "osAwaitingPayment", awaiting_confirmation: "osAwaitingConfirmation",
  paid: "osPaid", canceled: "osCanceled", refunded: "osRefunded",
};
export const isDead = (s: string) => s === "canceled" || s === "refunded";
export const stepOf = (s: string) => ORDER_STEPS.indexOf(s as (typeof ORDER_STEPS)[number]);
export function statusCls(s: string): string {
  if (s === "paid") return "bg-green-500/10 text-green-600";
  if (isDead(s)) return "bg-destructive/10 text-destructive";
  if (s === "awaiting_confirmation") return "bg-amber-500/10 text-amber-600";
  return "bg-blue-500/10 text-blue-600";
}
