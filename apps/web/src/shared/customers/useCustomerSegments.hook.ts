import { useCallback, useEffect, useState } from "react";
import { listSegments, upsertSegment, deleteSegment, type CustomerSegment, type SegPayload } from "@shared/customers/customer-segments.repository";

// Carga los segmentos del tenant y expone las mutaciones CRUD (devuelven mensaje de error o null).
export function useCustomerSegments(tenantId: string) {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const refresh = useCallback(() => { if (tenantId) void listSegments(tenantId).then(setSegments); }, [tenantId]);
  useEffect(refresh, [refresh]);
  const after = async (e: string | null) => { if (!e) refresh(); return e; };
  return {
    segments, refresh,
    save: async (p: SegPayload) => after(await upsertSegment(p)),
    remove: async (id: string) => after(await deleteSegment(id)),
  };
}
