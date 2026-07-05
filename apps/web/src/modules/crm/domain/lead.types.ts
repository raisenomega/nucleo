// BC crm — tipos de dominio de leads. Puro: sin imports externos.
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export interface Lead {
  readonly id: string;
  readonly tenantId: string;
  readonly contactName: string;
  readonly phone: string;
  readonly email: string;
  readonly serviceRequested: string;
  readonly leadSource: string;
  readonly temperature: string;        // hot | warm | cold
  readonly status: string;             // new | contacted | quoted | converted | lost
  readonly callDate: string;           // ← call_date (yyyy-mm-dd)
  readonly notes: string;              // ← notes (notas de llamada)
  readonly createdAt: string;
  readonly evidenceUrls: readonly string[];
}

export interface LeadFormData {
  readonly contactName: string;
  readonly phone: string;
  readonly email: string;
  readonly serviceRequested: string;
  readonly leadSource: string;
  readonly temperature: string;
  readonly status: string;
  readonly callDate: string;
  readonly notes: string;
  readonly evidenceUrls?: readonly string[];
}

export type LeadListResult = Result<Lead[], string>;

// Puerto del repositorio — lo implementa infrastructure; lo consume application (DI).
export interface ILeadRepository {
  list(): Promise<LeadListResult>;
  create(data: LeadFormData): Promise<Result<Lead, string>>;
  update(id: string, data: LeadFormData): Promise<Result<Lead, string>>;
  remove(id: string): Promise<Result<null, string>>;
}
