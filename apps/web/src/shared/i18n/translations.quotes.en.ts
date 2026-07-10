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
  loadingQuote: "Loading quote…", quoteLinkExpired: "The link expired. Contact", quoteAlreadyResponded: "This quote was already answered.",
  quoteNotFound: "Quote not found.", tooManyRequests: "Too many requests. Try again later.",
  viewAndRespond: "View and respond to quote", acceptQuote: "Accept", rejectQuote: "Reject", rejectReason: "Reason (optional)",
  quoteAcceptedThanks: "Quote accepted! Thank you.", quoteRejectedThanks: "Quote rejected. Thanks for your response.",
  pdfNotAvailable: "PDF temporarily unavailable. Contact", respondError: "Could not record your response. Try again.",
} satisfies Partial<Record<TranslationKey, string>>;
