import { useEffect, useState } from "react";
import type { IDashboardRepository, Snapshot, CrmSnapshot, MktSnapshot } from "@finance/domain/dashboard.types";

// Recibe el repositorio por inyección (DI) — NO importa infrastructure (A9 + oráculo #3).
export function useDashboard(repo: IDashboardRepository) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [crm, setCrm] = useState<CrmSnapshot | null>(null);
  const [mkt, setMkt] = useState<MktSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void Promise.all([repo.getSnapshot(), repo.getCrmSnapshot(), repo.getMarketingSnapshot()]).then(([s, c, mk]) => {
      setSnapshot(s);
      setCrm(c);
      setMkt(mk);
      setIsLoading(false);
    });
  }, [repo]);

  return { snapshot, crm, mkt, isLoading };
}
