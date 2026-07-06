import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (conciliación v2). Se fusiona en translations.ts.
export const esRecon = {
  deposit: "Depósito", deposits: "Depósitos", egresos: "Egresos", registerBalance: "Registrar saldo",
  openingBalance: "Balance inicial", realBalance: "Balance real", calculatedBalance: "Balance calculado",
  depositType: "Tipo", cash: "Efectivo", check: "Cheque", transfer: "Transferencia", other: "Otro",
  referenceNumber: "Nº referencia",
  retentionAuto: "Retención automática",
  retentionAutoNote: "Calculada sobre los ingresos del mes. Informativo — no requiere acción.",
  accumulated: "Acumulado", operatingMargin: "Margen operativo",
  breakEven: "Punto de equilibrio", surplus: "Superávit", shortfall: "Faltante", trend: "Tendencia",
  dashboardFiscal: "Fiscal", breakEvenProgress: "del punto de equilibrio", bankBalance: "Balance en banco",
  fixedExpense: "Fijo", variableExpense: "Variable", debtExpense: "Deuda", oneTimeExpense: "Único",
  unclassified: "Sin clasificar", classifyCategories: "clasifique sus categorías",
  breakEvenComposition: "gastos fijos + nómina",
  payrollCost: "Costo total nómina", fixedCosts: "Gastos fijos",
  recurringExpenses: "Gastos fijos recurrentes",
  recurringSubtitle: "Configura los gastos que se repiten cada mes. El sistema te indica cuáles ya pagaste.",
  budgeted: "Presupuestado", paid: "Pagado", addRecurring: "Añadir gasto fijo",
  registerPayment: "Registrar pago", manageRecurring: "Gestionar recurrentes", frequencyLabel: "Frecuencia",
  coveredPercent: "Has cubierto {done} de {total} gastos fijos ({pct}%)", newCategory: "Nueva categoría",
} satisfies Partial<Record<TranslationKey, string>>;
