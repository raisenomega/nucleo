import { useEffect, useState } from "react";
import type {
  IDashboardRepository, Snapshot, CrmSnapshot, MktSnapshot, FiscalSnapshot, Aging, InvSnapshot, OpsSnapshot, TrendPoint, QuotesSummary, FleetPos,
} from "@finance/domain/dashboard.types";
import type { Result } from "@finance/domain/payroll.types";

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
  const [errors, setErrors] = useState<readonly string[]>([]);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const base = month ?? new Date();
    const prev = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    const safe = <T,>(p: Promise<T>) => p.catch(() => null);
    // Las 7 bandas del Bucket B devuelven Result; se desenvuelven aqui para que DashData no cambie de forma
    // (cero cambios en los componentes que pintan) y sus errores se juntan aparte.
    const val = <T,>(r: Result<T, string> | null): T | null => (r && r.ok ? r.value : null);
    const er = (r: Result<unknown, string> | null): string | null => (r && !r.ok ? r.error : null);
    void Promise.all([
      safe(repo.getSnapshot(month)), safe(repo.getCrmSnapshot(month)), safe(repo.getMarketingSnapshot(month)), safe(repo.getReconciliationSnapshot(month)),
      safe(repo.getArAging()), safe(repo.getApAging()), safe(repo.getInventory()), safe(repo.getOps()), safe(repo.getTrend()), safe(repo.getSnapshot(prev)),
      safe(repo.getQuotes()), safe(repo.getFleet()),
    ]).then((r) => {
      if (!alive) return;
      setD({ snapshot: r[0], crm: r[1], mkt: r[2], fiscal: r[3], ar: val(r[4]), ap: val(r[5]), inv: val(r[6]), ops: val(r[7]),
        trend: val(r[8]) ?? [], prevSnapshot: r[9], quotes: val(r[10]), fleet: val(r[11]) ?? [] });
      setErrors([r[4], r[5], r[6], r[7], r[8], r[10], r[11]].map(er).filter((x): x is string => x !== null));
      setLoading(false);
    });
    return () => { alive = false; };
  }, [repo, month]);
  return { d, loading, errors };
}
