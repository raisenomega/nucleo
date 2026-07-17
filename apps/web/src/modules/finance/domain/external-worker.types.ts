// BC finance — trabajadores externos: registro reutilizable de personas SIN cuenta que se pagan vía nómina. Puro.
import type { Result, WorkerType } from "@finance/domain/payroll.types";

export type ExternalWorkerType = Exclude<WorkerType, "employee">;

export interface ExternalWorker {
  readonly id: string;
  readonly fullName: string;
  readonly workerType: ExternalWorkerType;
  readonly taxId: string;
  readonly contact: string;
  readonly notes: string;
  readonly active: boolean;
}

export interface ExternalWorkerFormData {
  readonly fullName: string;
  readonly workerType: ExternalWorkerType;
  readonly taxId: string;
  readonly contact: string;
  readonly notes: string;
  readonly active: boolean;
}

export type ExternalWorkerListResult = Result<ExternalWorker[], string>;

// Puerto del repositorio — lo implementa infrastructure; lo consume application (DI).
export interface IExternalWorkerRepository {
  list(): Promise<ExternalWorkerListResult>;
  create(data: ExternalWorkerFormData): Promise<Result<ExternalWorker, string>>;
  update(id: string, data: ExternalWorkerFormData): Promise<Result<ExternalWorker, string>>;
  remove(id: string): Promise<Result<null, string>>;
}
