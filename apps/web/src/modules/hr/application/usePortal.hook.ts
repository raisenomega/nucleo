import { useCallback, useEffect, useState } from "react";
import type { IPortalRepository, MyDetails, MyDetailsEdit, PortalSummary } from "@hr/domain/portal.types";

// DI del repo. Carga el resumen (KPIs del dashboard) + mis datos. Los demás tabs cargan lo suyo vía repo.
export function usePortal(repo: IPortalRepository) {
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [details, setDetails] = useState<MyDetails | null>(null);
  const load = useCallback(async () => {
    const [s, d] = await Promise.all([repo.summary(), repo.details()]);
    setSummary(s); setDetails(d);
  }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const updateDetails = useCallback(async (e: MyDetailsEdit) => { const r = await repo.updateDetails(e); if (r.ok) await load(); return r; }, [repo, load]);
  return { summary, details, reload: load, updateDetails, repo };
}
