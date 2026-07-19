import { useCallback, useEffect, useState } from "react";
import { getMyCustomer } from "@shared/portal/customer.repository";
import type { CustomerProfile } from "@shared/portal/customer.types";

// Carga el perfil del customer logueado para el tenant del host. null = no es cliente de este negocio.
export function useCustomer(tenantId: string | null) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!tenantId) { setCustomer(null); setLoading(false); return; }
    setLoading(true); setCustomer(await getMyCustomer(tenantId)); setLoading(false);
  }, [tenantId]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { customer, loading, refresh };
}
