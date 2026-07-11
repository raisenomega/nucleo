import type { TranslationKey } from "@shared/i18n";
import type { QuoteStatus } from "@quotes/domain/quote.types";

export const QUOTE_ST_KEY: Record<QuoteStatus, TranslationKey> = {
  draft: "qsDraft", sent: "qsSent", viewed: "qsViewed", accepted: "qsAccepted",
  rejected: "qsRejected", expired: "qsExpired", converted: "qsConverted",
};
export const QUOTE_ST_COLOR: Record<QuoteStatus, string> = {
  draft: "bg-secondary", sent: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300", viewed: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300", rejected: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  expired: "bg-secondary line-through", converted: "bg-primary/15 text-primary",
};
