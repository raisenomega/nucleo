import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (Quotes). Merged in translations.ts.
export const enQuotes = {
  quotesSubtitle: "Quotes with approval flow — lead → quote → invoice → income",
  newQuote: "New quote", quoteNumber: "Quote #", validUntil: "Valid until", terms: "Terms",
  markAccepted: "Mark accepted", markRejected: "Mark rejected", sendEmail: "Send email", totalQuoted: "Total quoted",
  qsDraft: "Draft", qsSent: "Sent", qsViewed: "Viewed", qsAccepted: "Accepted",
  qsRejected: "Rejected", qsExpired: "Expired", qsConverted: "Converted",
  sendQuote: "Send quote", resendQuote: "Resend quote", resend: "Resend", sending: "Sending…",
  lastSentOn: "Last sent on", editedAfterSent: "Edited after last send — the client has an old version.",
  personalMessage: "Message for the client (optional)",
  noEmailWarning: "The client has no email on file. It will be sent via WhatsApp only.",
  noChannels: "No channels available to send", sendError: "Could not send the quote", sentOk: "Quote sent",
} satisfies Partial<Record<TranslationKey, string>>;
