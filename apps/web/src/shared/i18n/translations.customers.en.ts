import type { TranslationKey } from "./translations.keys";

// Admin CRM view of portal customers. Merged in translations.ts.
export const enCustomers = {
  cTotalCustomers: "Total customers", cActive30: "Active (30d)", cTotalBilled: "Total billed", cAvgRating: "Avg. rating",
  cOrders: "Orders", cBilled: "Billed", cLastOrder: "Last order", cRating: "Rating",
  cActiveSt: "Active", cInactiveSt: "Inactive", cWithDebt: "With debt",
  cNoCustomers: "You have no registered customers yet", cRegisterHint: "Customers register on your portal (yourdomain.com/portal).",
  cProfile: "Profile", cInvoices: "Invoices", cServices: "Services", cTickets: "Tickets", cReviews: "Reviews",
  cReply: "Reply", cSendReply: "Send", cDeactivate: "Deactivate account", cActivate: "Reactivate account",
  cInternalNote: "Internal note", cRegisteredOn: "Registered", cNoOrders: "No orders",
} satisfies Partial<Record<TranslationKey, string>>;
