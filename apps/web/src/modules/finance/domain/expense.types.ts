// BC finance — tipos de dominio de gastos. Puro: sin imports externos.
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export interface Expense {
  readonly id: string;
  readonly tenantId: string;
  readonly categoryId: string;
  readonly categoryLabel: string;      // del join a categories
  readonly amount: number;
  readonly description: string;        // ← notes
  readonly date: string;               // ← expense_date (yyyy-mm-dd)
  readonly paymentMethodId: string;
  readonly paymentMethodLabel: string; // del join a categories
  readonly createdBy: string;
  readonly createdAt: string;
  readonly evidenceUrls: readonly string[]; // rutas de storage (bucket evidence)
}

export interface ExpenseFormData {
  readonly categoryId: string;
  readonly amount: number;
  readonly description: string;
  readonly date: string;
  readonly paymentMethodId: string;
  readonly evidenceUrls?: readonly string[];
}

export type ExpenseListResult = Result<Expense[], string>;

// Puerto del repositorio — lo implementa infrastructure; lo consume application (DI).
export interface IExpenseRepository {
  list(): Promise<ExpenseListResult>;
  create(data: ExpenseFormData): Promise<Result<Expense, string>>;
  update(id: string, data: ExpenseFormData): Promise<Result<Expense, string>>;
  remove(id: string): Promise<Result<null, string>>;
}
