export type RepoResult = { ok: true } | { ok: false; error: string };

// Una fila de month_closures (mes ya cerrado). Totales congelados en el momento del cierre.
export interface MonthClosure {
  periodYear: number; periodMonth: number;
  totalIncome: number; totalExpenses: number; totalPayroll: number; totalExtraordinary: number;
  netBalance: number; closedBy: string; closedAt: string;
}

// Totales de un mes según preview_month_close (lo que el dialog muestra ANTES de cerrar).
export interface MonthTotals {
  totalIncome: number; totalExpenses: number; totalPayroll: number;
  totalExtraordinary: number; netBalance: number;
}

export interface IMonthClosureRepository {
  listClosures(): Promise<MonthClosure[]>;
  preview(year: number, month: number): Promise<MonthTotals | null>;
  close(year: number, month: number): Promise<RepoResult>;
  reopen(year: number, month: number, reason: string): Promise<RepoResult>;
}
