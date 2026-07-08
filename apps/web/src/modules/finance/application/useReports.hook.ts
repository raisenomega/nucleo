import { useCallback, useEffect, useMemo, useState } from "react";
import type { IReportRepository, ReportSeries, EmployeePerformance } from "@finance/domain/report.types";

export type Period = "month" | "q" | "half" | "year";

// Rango [from, to] segun el selector. new Date() en application (no en domain) — permitido por el oraculo.
function rangeFor(p: Period): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now);
  if (p === "month") start.setDate(1);
  else if (p === "q") start.setMonth(now.getMonth() - 2, 1);
  else if (p === "half") start.setMonth(now.getMonth() - 5, 1);
  else start.setMonth(0, 1);
  return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

export function useReports(repo: IReportRepository) {
  const [period, setPeriod] = useState<Period>("half");
  const [series, setSeries] = useState<ReportSeries | null>(null);
  const [employees, setEmployees] = useState<EmployeePerformance[]>([]);
  const range = useMemo(() => rangeFor(period), [period]);
  const load = useCallback(async () => {
    const [s, e] = await Promise.all([
      repo.getSeries(range.from, range.to), repo.getEmployeePerformance(range.from, range.to),
    ]);
    setSeries(s); setEmployees(e);
  }, [repo, range]);
  useEffect(() => { void load(); }, [load]);
  return { period, setPeriod, series, employees, range };
}
