// BC crm — tipos de dominio de marketing (presupuestos + gastos). Puro: sin imports externos.
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export interface Budget {
  readonly id: string;
  readonly tenantId: string;
  readonly month: string;        // yyyy-mm-dd (primer día del mes)
  readonly channel: string;
  readonly budgetedAmount: number;
  readonly notes: string;
}

export interface BudgetFormData {
  readonly month: string;
  readonly channel: string;
  readonly budgetedAmount: number;
  readonly notes: string;
}

export interface MarketingExpense {
  readonly id: string;
  readonly tenantId: string;
  readonly budgetId: string;
  readonly channel: string;
  readonly date: string;         // expense_date
  readonly amount: number;
  readonly description: string;
  readonly campaignName: string;
  readonly notes: string;
  readonly evidenceUrls: readonly string[];
}

export interface MExpenseFormData {
  readonly budgetId: string;
  readonly channel: string;
  readonly date: string;
  readonly amount: number;
  readonly description: string;
  readonly campaignName: string;
  readonly notes: string;
  readonly evidenceUrls?: readonly string[];
}

export type BudgetListResult = Result<Budget[], string>;
export type MExpenseListResult = Result<MarketingExpense[], string>;

export interface IBudgetRepository {
  list(): Promise<BudgetListResult>;
  save(id: string | null, data: BudgetFormData): Promise<Result<null, string>>;
  remove(id: string): Promise<Result<null, string>>;
}

export interface IMExpenseRepository {
  list(): Promise<MExpenseListResult>;
  save(id: string | null, data: MExpenseFormData): Promise<Result<null, string>>;
  remove(id: string): Promise<Result<null, string>>;
}
