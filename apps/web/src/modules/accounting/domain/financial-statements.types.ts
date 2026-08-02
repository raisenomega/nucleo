// BC accounting — estados financieros formales desde el GL.
import type { Result } from "@accounting/domain/chart-of-accounts.types";
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

export interface CashFlowItem { readonly label: string; readonly code: string; readonly amount: number; }
export interface CashFlowWcItem { readonly label: string; readonly code: string; readonly change: number; readonly description: string; }
export interface CashFlowStatement {
  readonly period: { readonly year: number; readonly monthFrom: number; readonly monthTo: number };
  readonly operating: { readonly netIncome: number; readonly adjustments: readonly CashFlowItem[]; readonly workingCapital: readonly CashFlowWcItem[]; readonly total: number };
  readonly investing: { readonly items: readonly CashFlowItem[]; readonly total: number };
  readonly financing: { readonly items: readonly CashFlowItem[]; readonly total: number };
  readonly summary: { readonly netChange: number; readonly cashBeginning: number; readonly cashEnding: number; readonly verification: boolean };
}

export interface IFinancialStatementsRepository {
  // Result: un null no distinguia «periodo sin movimientos» de «la RPC fallo», y el mensaje del servidor
  // (codigo `forbidden`) se estaba descartando (auditoria E2E §13).
  getIncomeStatement(f: StatementFilters): Promise<Result<IncomeStatement, string>>;
  getBalanceSheet(asOfDate: string): Promise<Result<BalanceSheet, string>>;
  getCashFlow(f: StatementFilters): Promise<Result<CashFlowStatement, string>>;
}
