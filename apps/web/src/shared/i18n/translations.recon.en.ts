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
} satisfies Partial<Record<TranslationKey, string>>;
