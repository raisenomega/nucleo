// BC finance — tipos de dominio de nómina. Puro: sin imports externos.
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export type WorkerType = "employee" | "contractor";

export interface PayrollDeduction {
  readonly label: string; readonly rate: number; readonly base: number; readonly amount: number;
}

export interface Payroll {
  readonly id: string;
  readonly tenantId: string;
  readonly employeeId: string;
  readonly employeeName: string;       // del join a profiles
  readonly amount: number;
  readonly period: string;             // ENUM: Semana | Quincena | Mensual
  readonly paymentMethodId: string;
  readonly paymentMethodLabel: string; // del join a categories
  readonly date: string;               // ← pay_date (yyyy-mm-dd)
  readonly notes: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly evidenceUrls: readonly string[];
  readonly workerType: WorkerType;
  readonly grossSalary: number;
  readonly deductionsEmployee: readonly PayrollDeduction[];
  readonly contributionsEmployer: readonly PayrollDeduction[];
  readonly netSalary: number;
  readonly totalEmployerCost: number;
}

export interface PayrollFormData {
  readonly employeeId: string;
  readonly amount: number;
  readonly period: string;
  readonly paymentMethodId: string;
  readonly date: string;
  readonly notes: string;
  readonly evidenceUrls?: readonly string[];
  readonly workerType?: WorkerType;
  readonly grossSalary?: number;
}

export type PayrollListResult = Result<Payroll[], string>;

// Puerto del repositorio — lo implementa infrastructure; lo consume application (DI).
export interface IPayrollRepository {
  list(): Promise<PayrollListResult>;
  create(data: PayrollFormData): Promise<Result<Payroll, string>>;
  update(id: string, data: PayrollFormData): Promise<Result<Payroll, string>>;
  remove(id: string): Promise<Result<null, string>>;
}
