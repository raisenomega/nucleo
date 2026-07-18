import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (service routes). Merged in translations.ts.
export const enRoutes = {
  newRoute: "New route", routeStops: "Stops", addStop: "Add stop", stopTimeRequired: "Set the time for each stop before saving.",
  completeStop: "Complete", stopCompleted: "Collected", alreadyCompleted: "Already completed", stopsCompleted: "completed",
  openMap: "Map", collectPayment: "Collect", amountReceived: "Received", changeAmount: "Change",
  notAttended: "Not collected", reason: "Reason", completeAndCollect: "Complete and collect", pendingDebt: "Pending debt",
  accountsReceivable: "Accounts Receivable", stopDetail: "Stop detail", callClient: "Call", membershipClient: "Membership client",
  more: "More", account: "Account", scheduledTime: "Time", serviceDescription: "Service description",
  supplies: "Materials", usedSupplies: "Used materials",
  pendingDebts: "Pending debts from unattended stops", totalPending: "Total pending",
  collect: "Collect", forgive: "Forgive", forgiveReason: "Reason to forgive the debt",
  reminder: "WhatsApp reminder", addNote: "Add note", managementNote: "Management note", noteSaved: "Note saved",
  noPhone: "No phone",
  voidBtn: "VOID", voidTitle: "Confirm VOID", voidReasonLabel: "VOID reason",
  voidReasonPlaceholder: "Briefly explain why you're voiding (minimum 3 characters)",
  voidConfirmBtn: "Confirm VOID", voidCancelBtn: "Cancel", voidedBadge: "VOID",
  voidedTooltip: "Voided by {name} on {date}", voidedReasonTooltip: "Reason: {reason}",
  voidReasonTooShort: "Reason must be at least 3 characters",
  voidSuccess: "Record voided", voidError: "Could not void record",
  deleteForeverBtn: "Delete permanently", deleteForeverConfirm: "This action is permanent and cannot be undone. Continue?",
  deleteForeverSuccess: "Record permanently deleted", hideVoided: "Hide voided", showVoided: "Show voided",
  cannotEditOthersRoute: "You can't edit other employees' routes",
  evidenceBefore: "Evidence — Before", evidenceAfter: "Evidence — After",
  evidenceRequired: "Upload at least 1 before and 1 after photo to complete",
  assignedVehicle: "Assigned vehicle", vehicle: "Vehicle",
  stopVerified: "GPS verified", stopUnverified: "Not verified",
} satisfies Partial<Record<TranslationKey, string>>;
