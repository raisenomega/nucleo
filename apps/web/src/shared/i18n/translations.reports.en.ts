import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (Reports / business intelligence). Merged in translations.ts.
export const enReports = {
  reportsSubtitle: "Business intelligence center",
  pillarSales: "Sales & Clients", pillarEmployees: "Employees", pillarFinancial: "Financial", pillarMarketing: "Marketing",
  rFunnel: "Sales funnel", rIncomeByCategory: "Income by category", rTopClients: "Top 5 clients",
  rLeadsBySource: "Acquisition by channel (CAC)", rPerformance: "Employee performance",
  rProductivity: "Productivity (collected)", rLaborCost: "Labor cost", rCompleted: "Completed",
  collectionRate: "Collection rate", rIncomeVsExpense: "Income vs expenses by month", rExpenseByClass: "Expenses by class",
  rMargin: "Operating margin", rBreakeven: "Break-even (trend)", rBudgetVsSpent: "Budget vs spent",
  rCacByChannel: "CAC by channel", rRoiByChannel: "ROI by channel",
  pMonth: "This month", p3m: "3 months", p6m: "6 months", pYear: "This year",
} satisfies Partial<Record<TranslationKey, string>>;
