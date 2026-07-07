import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (service routes). Merged in translations.ts.
export const enRoutes = {
  newRoute: "New route", routeStops: "Stops", addStop: "Add stop",
  completeStop: "Complete", stopCompleted: "Collected", alreadyCompleted: "Already completed", stopsCompleted: "completed",
  openMap: "Map", collectPayment: "Collect", amountReceived: "Received", changeAmount: "Change",
  notAttended: "Not attended", reason: "Reason", completeAndCollect: "Complete and collect", pendingDebt: "Pending debt",
  accountsReceivable: "Accounts Receivable", stopDetail: "Stop detail", callClient: "Call", membershipClient: "Membership client",
  more: "More", account: "Account", scheduledTime: "Time", serviceDescription: "Service description",
  supplies: "Supplies", usedSupplies: "Used supplies",
  pendingDebts: "Pending debts from unattended stops", totalPending: "Total pending",
  collect: "Collect", forgive: "Forgive", forgiveReason: "Reason to forgive the debt",
  reminder: "WhatsApp reminder", addNote: "Add note", managementNote: "Management note", noteSaved: "Note saved",
} satisfies Partial<Record<TranslationKey, string>>;
