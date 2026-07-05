// BC finance — tipos de dominio del dashboard. Puro: sin imports externos.
export interface RecentItem {
  readonly date: string;
  readonly category: string | null;
  readonly amount: number;
}

export interface Snapshot {
  readonly totalIncome: number;
  readonly totalExpenses: number;
  readonly balance: number;
  readonly incomeCount: number;
  readonly expenseCount: number;
  readonly topIncomeCategory: string | null;
  readonly topExpenseCategory: string | null;
  readonly recentIncome: readonly RecentItem[];
  readonly recentExpenses: readonly RecentItem[];
}

// Puerto del repositorio — lo implementa infrastructure; lo consume application (DI).
export interface IDashboardRepository {
  getSnapshot(month?: Date): Promise<Snapshot | null>;
}
