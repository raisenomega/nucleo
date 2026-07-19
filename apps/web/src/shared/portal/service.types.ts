// Portal P3 — servicios (route_stops del cliente) y citas (appointments). Solo lectura + acciones de cita.
export interface CustomerService {
  readonly id: string; readonly serviceType: string; readonly status: string; readonly completedAt: string | null;
  readonly notes: string; readonly address: string; readonly evidenceCount: number;
}

export interface CustomerAppointment {
  readonly id: string; readonly title: string; readonly startsAt: string; readonly endsAt: string;
  readonly status: string; readonly meetingLink: string;
}
