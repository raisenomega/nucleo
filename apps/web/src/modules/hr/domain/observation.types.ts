// BC hr — observaciones gerenciales (bitácora de coaching). Puro.
export type ObsResult = { ok: true } | { ok: false; error: string };
export type ObsCategory = "LOGRO" | "OPORTUNIDAD_MEJORA" | "INCIDENTE" | "CULTURAL" | "SUGERENCIA_DESARROLLO";

export interface Observation {
  readonly id: string; readonly employeeId: string; readonly employeeName: string;
  readonly category: ObsCategory; readonly notes: string;
  readonly requiresFollowUp: boolean; readonly followUpDate: string | null; readonly createdAt: string;
}

export interface IObservationRepository {
  list(): Promise<Observation[]>;
  listForEmployee(employeeId: string): Promise<Observation[]>;
  save(employeeId: string, category: ObsCategory, notes: string, followUp: string | null): Promise<ObsResult>;
  remove(id: string): Promise<ObsResult>;
}
