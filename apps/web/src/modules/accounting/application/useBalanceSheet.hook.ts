import { useEffect, useState } from "react";
import type { BalanceSheet, IFinancialStatementsRepository } from "@accounting/domain/financial-statements.types";

// DI del repo. Carga el balance general a una fecha de corte.
export function useBalanceSheet(repo: IFinancialStatementsRepository, asOfDate: string) {
  const [sheet, setSheet] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    void repo.getBalanceSheet(asOfDate).then((r) => { if (!alive) return;
      setSheet(r.ok ? r.value : null); setError(r.ok ? null : r.error); setLoading(false); });
    return () => { alive = false; };
  }, [repo, asOfDate]);
  return { sheet, loading, error };
}
