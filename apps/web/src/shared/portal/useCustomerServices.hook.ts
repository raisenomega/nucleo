import { useCallback, useEffect, useState } from "react";
import { listServices, listAppointments, rescheduleAppointment, cancelAppointment } from "@shared/portal/service.repository";
import type { CustomerService, CustomerAppointment } from "@shared/portal/service.types";

// Servicios (route_stops) + citas del cliente, con reagendar/cancelar que refrescan.
export function useCustomerServices(tenantId: string) {
  const [services, setServices] = useState<CustomerService[]>([]);
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const refresh = useCallback(async () => { setServices(await listServices(tenantId)); setAppointments(await listAppointments(tenantId)); }, [tenantId]);
  useEffect(() => { void refresh(); }, [refresh]);
  const reschedule = useCallback(async (id: string, s: string, e: string) => { const ok = await rescheduleAppointment(id, s, e); if (ok) await refresh(); return ok; }, [refresh]);
  const cancel = useCallback(async (id: string) => { const ok = await cancelAppointment(id); if (ok) await refresh(); return ok; }, [refresh]);
  return { services, appointments, reschedule, cancel };
}
