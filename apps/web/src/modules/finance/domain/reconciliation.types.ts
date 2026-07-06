// BC finance — snapshot de conciliación v2. Espeja get_reconciliation_snapshot. Puro.
import type { RepoResult } from "@finance/domain/bank-account.types";
import type {
  FiscalStatus, BankPanelAccount, TaxObligation, MonthlySeriesRow, ExpenseBreakdownRow, HealthPanel,
} from "@finance/domain/reconciliation-health.types";
export type { FiscalStatus, BankPanelAccount, TaxObligation, MonthlySeriesRow, ExpenseBreakdownRow, HealthPanel };

export interface BankPanel {
  readonly accounts: readonly BankPanelAccount[];
  readonly openingBalance: number; readonly deposits: number; readonly egresos: number;
  readonly calculatedBalance: number; readonly realBalance: number; readonly difference: number;
  readonly totalBank: number; readonly totalSystem: number; // compat v1 (Commit 2 los retira)
}

export interface TaxPanel {
  readonly obligations: readonly TaxObligation[];
  readonly totalEstimated: number;
}

export interface RetentionPanel {
  readonly retentionPct: number; readonly required: number;
  readonly monthly: readonly MonthlySeriesRow[];
  readonly deposited: number; readonly pending: number; // compat v1 (Commit 2 los retira)
}

export interface SummaryPanel {
  readonly totalIncome: number; readonly totalExpenses: number; readonly totalPayroll: number;
  readonly totalExtraordinary: number; readonly totalMarketing: number; readonly operatingProfit: number;
  readonly taxEstimated: number; readonly retentionRequired: number; readonly availableBalance: number;
  readonly status: FiscalStatus;
  readonly expenseBreakdown: readonly ExpenseBreakdownRow[];
  readonly health: HealthPanel;
}

export interface ReconciliationSnapshot {
  readonly bank: BankPanel; readonly tax: TaxPanel;
  readonly retention: RetentionPanel; readonly summary: SummaryPanel;
}

export interface RetentionDepositFormData {
  readonly amount: number; readonly depositDate: string; readonly notes: string;
}
export interface RetentionDeposit extends RetentionDepositFormData { readonly id: string; }

// Puerto — lo implementa infrastructure (RPC + retention_deposits), lo consume application (DI). month = 'yyyy-mm'.
export interface IReconciliationRepository {
  getSnapshot(month: string): Promise<ReconciliationSnapshot | null>;
  listDeposits(month: string): Promise<readonly RetentionDeposit[]>;
  addDeposit(month: string, d: RetentionDepositFormData): Promise<RepoResult>;
}
