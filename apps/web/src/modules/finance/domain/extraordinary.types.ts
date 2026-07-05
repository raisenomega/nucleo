// BC finance — tipos de dominio de pagos extraordinarios. Puro: sin imports externos.
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export interface ExtraPayment {
  readonly id: string;
  readonly tenantId: string;
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly amount: number;
  readonly justification: string;      // NOT NULL, mín. 20 caracteres (CHECK en DB)
  readonly date: string;               // ← payment_date (yyyy-mm-dd)
  readonly paymentMethodId: string;
  readonly paymentMethodLabel: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly evidenceUrls: readonly string[];
}

export interface ExtraPaymentFormData {
  readonly categoryId: string;
  readonly amount: number;
  readonly justification: string;
  readonly date: string;
  readonly paymentMethodId: string;
  readonly evidenceUrls?: readonly string[];
}

export type ExtraPaymentListResult = Result<ExtraPayment[], string>;

// Puerto del repositorio — lo implementa infrastructure; lo consume application (DI).
export interface IExtraPaymentRepository {
  list(): Promise<ExtraPaymentListResult>;
  create(data: ExtraPaymentFormData): Promise<Result<ExtraPayment, string>>;
  update(id: string, data: ExtraPaymentFormData): Promise<Result<ExtraPayment, string>>;
  remove(id: string): Promise<Result<null, string>>;
}
