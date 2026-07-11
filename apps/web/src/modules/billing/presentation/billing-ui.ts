import type { TranslationKey } from "@shared/i18n";
import type { InvoiceStatus } from "@billing/domain/invoice.types";
import type { PlanFrequency, PlanStatus } from "@billing/domain/billing-plan.types";

export const INV_ST_KEY: Record<InvoiceStatus, TranslationKey> = {
  draft: "isDraft", sent: "isSent", paid: "isPaid", overdue: "isOverdue", cancelled: "isCancelled",
};
export const INV_ST_COLOR: Record<InvoiceStatus, string> = {
  draft: "bg-secondary", sent: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300", paid: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300", cancelled: "bg-secondary line-through",
};
export const FREQ: PlanFrequency[] = ["weekly", "biweekly", "monthly", "quarterly", "annual"];
export const FREQ_KEY: Record<PlanFrequency, TranslationKey> = {
  weekly: "freqWeekly", biweekly: "freqBiweekly", monthly: "freqMonthly", quarterly: "freqQuarterly", annual: "freqAnnual",
};
export const PLAN_ST_KEY: Record<PlanStatus, TranslationKey> = { active: "psActive", paused: "psPaused", cancelled: "psCancelled" };
export const PLAN_ST_COLOR: Record<PlanStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300", paused: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300", cancelled: "bg-secondary line-through",
};
