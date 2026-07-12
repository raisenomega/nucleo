import type { TranslationKey } from "@shared/i18n";
import type { OrderStatus } from "@orders/domain/order.types";

export const STATUS_LABEL: Record<OrderStatus, TranslationKey> = {
  pending: "ordStatusPending", awaiting_payment: "ordStatusAwaiting", awaiting_confirmation: "ordStatusAwaitingConfirm", paid: "ordStatusPaid",
  processing: "ordStatusProcessing", shipped: "ordStatusShipped", delivered: "ordStatusDelivered",
  canceled: "ordStatusCanceled", refunded: "ordStatusRefunded",
};

// Tonos badge dark-safe (par claro/oscuro por token de color).
export const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  awaiting_payment: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  awaiting_confirmation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  delivered: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  canceled: "bg-muted text-muted-foreground",
  refunded: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

// Dot del timeline (solo fondo).
export const STATUS_DOT: Record<OrderStatus, string> = {
  pending: "bg-amber-500", awaiting_payment: "bg-orange-500", awaiting_confirmation: "bg-yellow-500", paid: "bg-emerald-500", processing: "bg-blue-500",
  shipped: "bg-indigo-500", delivered: "bg-teal-500", canceled: "bg-muted-foreground", refunded: "bg-red-500",
};

export const money = (n: number, currency = "USD") => `$${n.toFixed(2)}${currency && currency !== "USD" ? " " + currency : ""}`;
