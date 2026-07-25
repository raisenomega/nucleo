// BC accounting — estados financieros formales desde el GL.
export interface StatementAccount { readonly code: string; readonly name: string; readonly amount: number; }

export interface IncomeStatementSummary {
  readonly totalRevenue: number; readonly totalCogs: number; readonly grossProfit: number; readonly grossMarginPct: number;
  readonly totalOpex: number; readonly operatingIncome: number; readonly operatingMarginPct: number;
  readonly totalNonOp: number; readonly netIncome: number; readonly netMarginPct: number;
}

export interface IncomeStatement {
  readonly period: { readonly year: number; readonly monthFrom: number; readonly monthTo: number };
  readonly revenue: readonly StatementAccount[]; readonly cogs: readonly StatementAccount[];
  readonly opex: readonly StatementAccount[]; readonly nonop: readonly StatementAccount[];
  readonly summary: IncomeStatementSummary;
}

export interface StatementFilters { readonly year: number; readonly monthFrom: number; readonly monthTo: number; }

export interface BSAccount { readonly code: string; readonly name: string; readonly balance: number; readonly isComputed?: boolean; }

export interface BalanceSheetSummary {
  readonly totalAssets: number; readonly totalLiabilities: number; readonly totalEquity: number;
  readonly totalLiabilitiesEquity: number; readonly isBalanced: boolean; readonly difference: number;
}

export interface BalanceSheet {
  readonly asOfDate: string;
  readonly assetsCurrent: readonly BSAccount[]; readonly assetsCurrentTotal: number;
  readonly assetsNonCurrent: readonly BSAccount[]; readonly assetsNonCurrentTotal: number;
  readonly liabCurrent: readonly BSAccount[]; readonly liabCurrentTotal: number;
  readonly liabLongTerm: readonly BSAccount[]; readonly liabLongTermTotal: number;
  readonly equity: readonly BSAccount[]; readonly equityTotal: number;
  readonly summary: BalanceSheetSummary;
}

export interface IFinancialStatementsRepository {
  getIncomeStatement(f: StatementFilters): Promise<IncomeStatement | null>;
  getBalanceSheet(asOfDate: string): Promise<BalanceSheet | null>;
}
