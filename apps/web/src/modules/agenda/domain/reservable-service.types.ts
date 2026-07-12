import type { Result } from "@agenda/domain/appointment-settings.types";
export type { Result };

// Servicio del catálogo con requires_scheduling=true. Config de reserva editable desde Agenda.
export interface ReservableService { id: string; name: string; durationMinutes: number | null; reserveType: string; reservePrice: number | null; }
export interface ServiceInput { name: string; durationMinutes: number; price: number | null; requiresScheduling: boolean; }
export interface IReservableServicesRepository {
  list(): Promise<ReservableService[]>;
  update(id: string, reserveType: string, reservePrice: number | null): Promise<Result>;
  create(tenantId: string, input: ServiceInput): Promise<ReservableService | null>;
}
