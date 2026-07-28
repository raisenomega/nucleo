import { useCallback, useEffect, useState } from "react";
import type { ISecurityRepository, SecurityDashboardData, SentinelScan } from "@shared/security/domain/security.types";

// Carga el panel (KPIs + listas embebidas) y el historial de scans en paralelo.
export function useSecurityDashboard(repo: ISecurityRepository) {
  const [data, setData] = useState<SecurityDashboardData | null>(null);
  const [scans, setScans] = useState<SentinelScan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [d, s] = await Promise.all([repo.getDashboard(), repo.listScans()]);
    setData(d);
    setScans(s);
    setLoading(false);
  }, [repo]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { data, scans, loading, refresh };
}
