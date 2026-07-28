import type { TranslationKey } from "@shared/i18n";
import type { DnStatus } from "@sales/domain/delivery-note.types";

export const DN_ST_KEY: Record<DnStatus, TranslationKey> = {
  draft: "soDraft", dispatched: "dispatched", in_transit: "inTransit", delivered: "delivered", cancelled: "soCancelled",
};
export const DN_ST_COLOR: Record<DnStatus, string> = {
  draft: "bg-secondary", dispatched: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  in_transit: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 line-through dark:bg-red-500/20 dark:text-red-300",
};
