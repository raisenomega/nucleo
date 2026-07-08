import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (Quotes). Merged in translations.ts.
export const enQuotes = {
  quotesSubtitle: "Quotes with approval flow — lead → quote → invoice → income",
  newQuote: "New quote", quoteNumber: "Quote #", validUntil: "Valid until", terms: "Terms",
  markAccepted: "Mark accepted", markRejected: "Mark rejected", sendEmail: "Send email", totalQuoted: "Total quoted",
  qsDraft: "Draft", qsSent: "Sent", qsViewed: "Viewed", qsAccepted: "Accepted",
  qsRejected: "Rejected", qsExpired: "Expired", qsConverted: "Converted",
} satisfies Partial<Record<TranslationKey, string>>;
