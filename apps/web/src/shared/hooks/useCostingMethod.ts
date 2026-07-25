import { useCallback, useEffect, useState } from "react";
import { getCostingMethod, setCostingMethodRpc, type CostingMethod } from "@shared/lib/costing";

// Método de costeo del tenant, cacheado a nivel de módulo para no re-consultar entre KPIs/Detail/settings.
let cache: CostingMethod | null = null;

export function useCostingMethod() {
  const [method, setMethod] = useState<CostingMethod | null>(cache);
  const reload = useCallback(async () => { const m = await getCostingMethod(); cache = m; setMethod(m); return m; }, []);
  useEffect(() => { if (cache == null) void reload(); }, [reload]);
  const change = useCallback(async (m: CostingMethod) => {
    const r = await setCostingMethodRpc(m);
    if (r.ok) { cache = m; setMethod(m); }
    return r;
  }, []);
  return { method, change, reload };
}
