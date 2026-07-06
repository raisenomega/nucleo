import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (reconciliation v2). Merged in translations.ts.
export const enRecon = {
  deposit: "Deposit", deposits: "Deposits", egresos: "Outflows", registerBalance: "Register balance",
  openingBalance: "Opening balance", realBalance: "Real balance", calculatedBalance: "Calculated balance",
  depositType: "Type", cash: "Cash", check: "Check", transfer: "Transfer", other: "Other",
  referenceNumber: "Reference no.",
  retentionAuto: "Automatic retention",
  retentionAutoNote: "Computed from the month's income. Informational — no action needed.",
  accumulated: "Accumulated", operatingMargin: "Operating margin",
  breakEven: "Break-even", surplus: "Surplus", shortfall: "Shortfall", trend: "Trend",
  dashboardFiscal: "Fiscal", breakEvenProgress: "of break-even", bankBalance: "Bank balance",
  fixedExpense: "Fixed", variableExpense: "Variable", debtExpense: "Debt", oneTimeExpense: "One-time",
  unclassified: "Unclassified", classifyCategories: "classify your categories",
  breakEvenComposition: "fixed expenses + payroll",
  payrollCost: "Total payroll cost", fixedCosts: "Fixed costs",
  recurringExpenses: "Recurring fixed expenses",
  recurringSubtitle: "Set up the expenses that repeat every month. The system shows which ones you've paid.",
  budgeted: "Budgeted", paid: "Paid", addRecurring: "Add fixed expense",
  registerPayment: "Register payment", manageRecurring: "Manage recurring", frequencyLabel: "Frequency",
  coveredPercent: "You've covered {done} of {total} fixed expenses ({pct}%)", newCategory: "New category",
  createCategory: "Create", categoryName: "Category name", selectExpenseClass: "Expense type",
  movementsSoon: "Movement history coming soon",
} satisfies Partial<Record<TranslationKey, string>>;
