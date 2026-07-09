// BC finance — tipos de dominio de ingresos. Puro: sin imports externos.
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export interface Income {
  readonly id: string;
  readonly tenantId: string;
  readonly categoryId: string;
  readonly categoryLabel: string;      // del join a categories
  readonly amount: number;
  readonly description: string;        // ← notes
  readonly date: string;               // ← income_date (yyyy-mm-dd)
  readonly paymentMethodId: string;
  readonly paymentMethodLabel: string; // del join a categories
  readonly clientReference: string;
  readonly orderNumber: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly evidenceUrls: readonly string[]; // rutas de storage (bucket evidence)
  readonly deletedAt: string | null;   // VOID (soft-delete): fecha de anulación
  readonly deletedBy: string | null;
  readonly deletedReason: string | null;
}

export interface IncomeFormData {
  readonly categoryId: string;
  readonly amount: number;
  readonly description: string;
  readonly date: string;
  readonly paymentMethodId: string;
  readonly clientReference: string;
  readonly orderNumber: string;
  readonly evidenceUrls?: readonly string[]; // opcional: el form lo aporta (Commit 2 UI)
}

export type IncomeListResult = Result<Income[], string>;

// Puerto del repositorio — lo implementa infrastructure; lo consume application (DI).
export interface IIncomeRepository {
  list(): Promise<IncomeListResult>;
  create(data: IncomeFormData): Promise<Result<Income, string>>;
  update(id: string, data: IncomeFormData): Promise<Result<Income, string>>;
  voidRow(id: string, reason: string): Promise<Result<null, string>>;  // VOID vía RPC void_income
  remove(id: string): Promise<Result<null, string>>;                   // hard delete (solo CEO, ya anulada)
}
