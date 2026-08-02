// BC finance — cuentas por cobrar (deudas de paradas no atendidas). Puro.
import type { Result } from "@finance/domain/payroll.types";
export type ARResult = { ok: true } | { ok: false; error: string };

export interface AccountReceivable {
  readonly stopId: string; readonly clientName: string; readonly phone: string | null;
  readonly amount: number; readonly routeDate: string;
  readonly assignedTo: string; readonly reason: string | null;
}
export interface ARSnapshot {
  readonly totalPending: number; readonly count: number; readonly items: readonly AccountReceivable[];
}

export interface IAccountsReceivableRepository {
  getAll(month?: string): Promise<Result<ARSnapshot, string>>;
  collectDebt(stopId: string, methodId: string): Promise<ARResult>;
  forgiveDebt(stopId: string, reason: string): Promise<ARResult>;
  addNote(stopId: string, text: string): Promise<ARResult>;
}
