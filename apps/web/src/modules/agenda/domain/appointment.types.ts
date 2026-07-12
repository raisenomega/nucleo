import type { Result } from "@agenda/domain/appointment-settings.types";
export type { Result };

export type AppointmentStatus = "agendada" | "confirmada" | "completada" | "cancelada" | "no-show";
export interface Appointment {
  id: string; leadId: string | null; serviceId: string | null; title: string;
  startsAt: string; endsAt: string; status: AppointmentStatus; notes: string;
  leadName: string | null; serviceName: string | null;
}
export type AppointmentInput = Omit<Appointment, "id" | "leadName" | "serviceName">;
export interface SaveResult { ok: boolean; code?: string }
export interface IAppointmentsRepository {
  list(status?: string): Promise<Appointment[]>;
  save(id: string | null, input: AppointmentInput): Promise<SaveResult>;
  remove(id: string): Promise<Result>;
}
