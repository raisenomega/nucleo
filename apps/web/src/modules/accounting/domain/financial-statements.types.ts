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

export interface IFinancialStatementsRepository {
  getIncomeStatement(f: StatementFilters): Promise<IncomeStatement | null>;
}
