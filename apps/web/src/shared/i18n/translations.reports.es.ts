import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (Reportes / centro de inteligencia). Se fusiona en translations.ts.
export const esReports = {
  reportsSubtitle: "Centro de inteligencia de negocio",
  pillarSales: "Ventas y Clientes", pillarEmployees: "Empleados", pillarFinancial: "Financiero", pillarMarketing: "Marketing",
  rFunnel: "Embudo de ventas", rIncomeByCategory: "Ingresos por categoría", rTopClients: "Top 5 clientes",
  rLeadsBySource: "Captación por canal (CAC)", rPerformance: "Rendimiento por empleado",
  rProductivity: "Productividad (cobros)", rLaborCost: "Costo laboral", rCompleted: "Completadas",
  collectionRate: "Tasa de cobro", rIncomeVsExpense: "Ingresos vs gastos por mes", rExpenseByClass: "Gastos por clase",
  rMargin: "Margen operativo", rBreakeven: "Break-even (evolución)", rBudgetVsSpent: "Presupuesto vs ejecutado",
  rCacByChannel: "CAC por canal", rRoiByChannel: "ROI por canal",
  pMonth: "Este mes", p3m: "3 meses", p6m: "6 meses", pYear: "Este año",
} satisfies Partial<Record<TranslationKey, string>>;
