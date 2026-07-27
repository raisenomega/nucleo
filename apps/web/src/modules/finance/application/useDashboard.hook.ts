import { useEffect, useState } from "react";
import type {
  IDashboardRepository, Snapshot, CrmSnapshot, MktSnapshot, FiscalSnapshot, Aging, InvSnapshot, OpsSnapshot, TrendPoint, QuotesSummary, FleetPos,
} from "@finance/domain/dashboard.types";

export interface DashData {
  snapshot: Snapshot | null; crm: CrmSnapshot | null; mkt: MktSnapshot | null; fiscal: FiscalSnapshot | null;
  ar: Aging | null; ap: Aging | null; inv: InvSnapshot | null; ops: OpsSnapshot | null;
  trend: readonly TrendPoint[]; prevSnapshot: Snapshot | null; quotes: QuotesSummary | null; fleet: readonly FleetPos[];
}

// Carga todas las bandas en paralelo para el período dado. Cada llamada con .catch → null (nunca cuelga el loading).
// Trae también el snapshot del mes anterior para la variación de KPIs. Recibe el repo por DI (no importa infra).
export function useDashboard(repo: IDashboardRepository, month?: Date) {
  const [d, setD] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const base = month ?? new Date();
    const prev = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    const safe = <T,>(p: Promise<T>) => p.catch(() => null);
    void Promise.all([
      safe(repo.getSnapshot(month)), safe(repo.getCrmSnapshot(month)), safe(repo.getMarketingSnapshot(month)), safe(repo.getReconciliationSnapshot(month)),
      safe(repo.getArAging()), safe(repo.getApAging()), safe(repo.getInventory()), safe(repo.getOps()), safe(repo.getTrend()), safe(repo.getSnapshot(prev)),
      safe(repo.getQuotes()), safe(repo.getFleet()),
    ]).then((r) => {
      if (!alive) return;
      setD({ snapshot: r[0], crm: r[1], mkt: r[2], fiscal: r[3], ar: r[4], ap: r[5], inv: r[6], ops: r[7], trend: r[8] ?? [], prevSnapshot: r[9], quotes: r[10], fleet: r[11] ?? [] });
      setLoading(false);
    });
    return () => { alive = false; };
  }, [repo, month]);
  return { d, loading };
}
