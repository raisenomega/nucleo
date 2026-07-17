// BC finance — trabajadores externos: registro reutilizable de personas SIN cuenta que se pagan vía nómina. Puro.
import type { Result, WorkerType } from "@finance/domain/payroll.types";

export type ExternalWorkerType = Exclude<WorkerType, "employee">;
export type PaymentPreference = "efectivo" | "ath_movil" | "transferencia" | "cheque";

interface ExternalWorkerFields {
  readonly fullName: string;
  readonly workerType: ExternalWorkerType;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly specialty: string;
  readonly department: string;
  readonly taxId: string;
  readonly hourlyRate: number | null;
  readonly dailyRate: number | null;
  readonly paymentPreference: PaymentPreference;
  readonly bankAccount: string;
  readonly notes: string;
  readonly active: boolean;
}

export interface ExternalWorker extends ExternalWorkerFields { readonly id: string; }
export type ExternalWorkerFormData = ExternalWorkerFields;

export type ExternalWorkerListResult = Result<ExternalWorker[], string>;

// Puerto del repositorio — lo implementa infrastructure; lo consume application (DI).
export interface IExternalWorkerRepository {
  list(): Promise<ExternalWorkerListResult>;
  create(data: ExternalWorkerFormData): Promise<Result<ExternalWorker, string>>;
  update(id: string, data: ExternalWorkerFormData): Promise<Result<ExternalWorker, string>>;
  remove(id: string): Promise<Result<null, string>>;
}
