import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (Billing). Merged in translations.ts.
export const enBilling = {
  billingSubtitle: "Invoices, recurring plans and web orders — all end in income",
  newInvoice: "New invoice", recurringPlans: "Recurring plans", newPlan: "New plan",
  clientName: "Client", invoiceNumber: "Invoice #", dueDate: "Due", nextBilling: "Next billing",
  saveDraft: "Save draft", saveChanges: "Save changes", markPaid: "Mark paid", generateInvoices: "Generate month's invoices",
  generateInvoice: "Generate invoice", pause: "Pause", resume: "Resume",
  isDraft: "Draft", isSent: "Sent", isPartial: "Partial", isPaid: "Paid", isOverdue: "Overdue", isCancelled: "Cancelled",
  psActive: "Active", psPaused: "Paused", psCancelled: "Cancelled",
  freqQuarterly: "Quarterly", freqAnnual: "Annual",
  kpiPending: "Pending", kpiOverdue: "Overdue", kpiMrr: "MRR",
} satisfies Partial<Record<TranslationKey, string>>;
