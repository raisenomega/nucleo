// BC finance — tipos del snapshot de conciliación (§4). Espeja get_reconciliation_snapshot. Puro.
import type { RepoResult } from "@finance/domain/bank-account.types";
export type FiscalStatus = "healthy" | "tight" | "at_risk";

// Línea del Panel 1 (cuenta con su balance del mes). La entidad CRUD vive en bank-account.types.ts.
export interface BankPanelAccount {
  readonly bankName: string;
  readonly balance: number;
  readonly cutoffDate: string;
}

export interface BankPanel {
  readonly accounts: readonly BankPanelAccount[];
  readonly totalBank: number;
  readonly totalSystem: number;
  readonly difference: number;
}

export interface TaxObligation {
  readonly label: string;
  readonly calcType: string;
  readonly rate: number;
  readonly base: number;
  readonly estimated: number;
  readonly frequency: string;
  readonly notes: string;
}

export interface TaxPanel {
  readonly obligations: readonly TaxObligation[];
  readonly totalEstimated: number;
}

export interface RetentionPanel {
  readonly retentionPct: number;
  readonly required: number;
  readonly deposited: number;
  readonly pending: number;
}

export interface SummaryPanel {
  readonly totalIncome: number;
  readonly totalExpenses: number;
  readonly totalPayroll: number;
  readonly totalExtraordinary: number;
  readonly totalMarketing: number;
  readonly operatingProfit: number;
  readonly taxEstimated: number;
  readonly retentionRequired: number;
  readonly availableBalance: number;
  readonly status: FiscalStatus;
}

export interface ReconciliationSnapshot {
  readonly bank: BankPanel;
  readonly tax: TaxPanel;
  readonly retention: RetentionPanel;
  readonly summary: SummaryPanel;
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
