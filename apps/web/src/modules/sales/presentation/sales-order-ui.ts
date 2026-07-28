import type { TranslationKey } from "@shared/i18n";
import type { SoStatus } from "@sales/domain/sales-order.types";

export const SO_ST_KEY: Record<SoStatus, TranslationKey> = {
  draft: "soDraft", confirmed: "soConfirmed", partially_shipped: "soPartiallyShipped", shipped: "soShipped",
  partially_invoiced: "soPartiallyInvoiced", invoiced: "soInvoiced", closed: "soClosed", cancelled: "soCancelled",
};
export const SO_ST_COLOR: Record<SoStatus, string> = {
  draft: "bg-secondary", confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  partially_shipped: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  shipped: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  partially_invoiced: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  invoiced: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  closed: "bg-secondary", cancelled: "bg-red-100 text-red-800 line-through dark:bg-red-500/20 dark:text-red-300",
};
