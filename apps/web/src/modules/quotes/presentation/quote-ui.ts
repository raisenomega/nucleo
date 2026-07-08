import type { TranslationKey } from "@shared/i18n";
import type { QuoteStatus } from "@quotes/domain/quote.types";

export const QUOTE_ST_KEY: Record<QuoteStatus, TranslationKey> = {
  draft: "qsDraft", sent: "qsSent", viewed: "qsViewed", accepted: "qsAccepted",
  rejected: "qsRejected", expired: "qsExpired", converted: "qsConverted",
};
export const QUOTE_ST_COLOR: Record<QuoteStatus, string> = {
  draft: "bg-secondary", sent: "bg-blue-100 text-blue-800", viewed: "bg-indigo-100 text-indigo-800",
  accepted: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800",
  expired: "bg-secondary line-through", converted: "bg-primary/15 text-primary",
};
