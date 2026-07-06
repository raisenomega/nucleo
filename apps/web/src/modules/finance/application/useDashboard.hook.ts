import { useEffect, useState } from "react";
import type { IDashboardRepository, Snapshot, CrmSnapshot, MktSnapshot, FiscalSnapshot } from "@finance/domain/dashboard.types";

// Recibe el repositorio por inyección (DI) — NO importa infrastructure (A9 + oráculo #3).
export function useDashboard(repo: IDashboardRepository) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [crm, setCrm] = useState<CrmSnapshot | null>(null);
  const [mkt, setMkt] = useState<MktSnapshot | null>(null);
  const [fiscal, setFiscal] = useState<FiscalSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      repo.getSnapshot(), repo.getCrmSnapshot(), repo.getMarketingSnapshot(), repo.getReconciliationSnapshot(),
    ]).then(([s, c, mk, fi]) => {
      setSnapshot(s);
      setCrm(c);
      setMkt(mk);
      setFiscal(fi);
      setIsLoading(false);
    });
  }, [repo]);

  return { snapshot, crm, mkt, fiscal, isLoading };
}
