import { useCallback, useEffect, useState } from "react";
import { listTickets, createTicket } from "@shared/portal/ticket.repository";
import type { CustomerTicket } from "@shared/portal/ticket.types";

// Tickets de soporte del cliente; crear refresca la lista.
export function useCustomerTickets(tenantId: string) {
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const refresh = useCallback(async () => { setTickets(await listTickets(tenantId)); }, [tenantId]);
  useEffect(() => { void refresh(); }, [refresh]);
  const create = useCallback(async (subject: string, description: string, priority: string) => {
    const ok = await createTicket(tenantId, subject, description, priority); if (ok) await refresh(); return ok;
  }, [tenantId, refresh]);
  return { tickets, create, refresh };
}
