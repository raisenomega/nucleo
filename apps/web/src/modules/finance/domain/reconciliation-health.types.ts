// BC finance — tipos auxiliares del snapshot de conciliación v2 (cuenta, obligación, serie, salud).
export type FiscalStatus = "healthy" | "tight" | "at_risk";
export type OperatingStatus = "surplus" | "tight" | "deficit";

export interface BankPanelAccount {
  readonly bankName: string;
  readonly openingBalance: number;
  readonly deposits: number;
  readonly calculatedBalance: number;
  readonly realBalance: number;
  readonly difference: number;
  readonly cutoffDate: string;
}

export interface TaxObligation {
  readonly label: string; readonly calcType: string; readonly rate: number;
  readonly base: number; readonly estimated: number; readonly frequency: string; readonly notes: string;
}

export interface MonthlySeriesRow {
  readonly month: number; readonly income: number; readonly retention: number; readonly totalOut: number;
  readonly operatingProfit: number; readonly margin: number; readonly accumulated: number;
}

export interface ExpenseBreakdownRow { readonly category: string; readonly amount: number; }

export interface ExpenseClasses {
  readonly fixed: number; readonly variable: number; readonly debt: number;
  readonly oneTime: number; readonly unclassified: number;
}

export interface HealthPanel {
  readonly totalOut: number; readonly breakEven: number; readonly breakEvenPct: number;
  readonly shortfall: number; readonly surplus: number; readonly operatingMargin: number;
  readonly operatingStatus: OperatingStatus; readonly trend: readonly MonthlySeriesRow[];
  readonly fixedExpenses: number; readonly variableExpenses: number;
  readonly debtExpenses: number; readonly oneTimeExpenses: number;
}
