// Ola 2.5a · staging de import de estado de cuenta. Índices de columna: -1 = sin asignar.
export type AmountMode = "signed" | "split";
export type DateFormat = "MDY" | "DMY" | "YMD";
export type MatchStatus = "unmatched" | "matched" | "ignored";

export interface ColumnMap {
  date: number; description: number;
  amountMode: AmountMode; amount: number; debit: number; credit: number;
  balance: number; ref: number; dateFormat: DateFormat;
}

// Línea ya estructurada que se envía a la RPC (snake_case = contrato del jsonb).
export interface ParsedLine {
  txn_date: string; description: string; amount: number;
  running_balance: number | null; external_ref: string | null; raw: Record<string, string>;
}

export interface ImportResult { batchId: string | null; inserted: number; skippedDuplicates: number }

export interface StatementLine {
  id: string; txnDate: string; description: string; amount: number;
  runningBalance: number | null; externalRef: string | null; matchStatus: MatchStatus; batchId: string;
}
export interface ImportBatch { id: string; fileName: string; rowCount: number; dateFrom: string | null; dateTo: string | null; createdAt: string }
export interface StatementLineFilters { bankAccountId?: string; month?: string; status?: MatchStatus | "all" }
