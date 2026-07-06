import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (service routes). Merged in translations.ts.
export const enRoutes = {
  newRoute: "New route", routeStops: "Stops", addStop: "Add stop",
  completeStop: "Complete", stopCompleted: "Collected", alreadyCompleted: "Already completed", stopsCompleted: "completed",
  openMap: "Map", collectPayment: "Collect", amountReceived: "Received", changeAmount: "Change",
  notAttended: "Not attended", reason: "Reason", completeAndCollect: "Complete and collect", pendingDebt: "Pending debt",
  accountsReceivable: "Accounts Receivable", stopDetail: "Stop detail", callClient: "Call", membershipClient: "Membership client",
} satisfies Partial<Record<TranslationKey, string>>;
