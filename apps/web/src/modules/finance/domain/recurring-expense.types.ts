// BC finance — plantilla de gastos fijos recurrentes. Puro.
import type { RepoResult } from "@finance/domain/bank-account.types";

export type RecurringFrequency = "monthly" | "quarterly" | "annual";

export interface RecurringExpense {
  readonly id: string;
  readonly tenantId: string;
  readonly categoryId: string;
  readonly categoryLabel: string;   // del join a categories
  readonly label: string;
  readonly budgetedAmount: number;
  readonly frequency: RecurringFrequency;
  readonly active: boolean;
}

export interface RecurringExpenseFormData {
  readonly categoryId: string;
  readonly label: string;
  readonly budgetedAmount: number;
  readonly frequency: RecurringFrequency;
}

// Puerto — lo implementa infrastructure; lo consume application (DI). month = 'yyyy-mm'.
export interface IRecurringRepository {
  list(): Promise<readonly RecurringExpense[]>;
  create(d: RecurringExpenseFormData): Promise<RepoResult>;
  update(id: string, d: RecurringExpenseFormData): Promise<RepoResult>;
  remove(id: string): Promise<RepoResult>;
  getPaidStatus(month: string): Promise<Record<string, number>>; // categoryId → pagado del mes
}
