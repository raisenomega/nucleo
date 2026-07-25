import { useEffect, useState } from "react";
import type { BalanceSheet, IFinancialStatementsRepository } from "@accounting/domain/financial-statements.types";

// DI del repo. Carga el balance general a una fecha de corte.
export function useBalanceSheet(repo: IFinancialStatementsRepository, asOfDate: string) {
  const [sheet, setSheet] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    void repo.getBalanceSheet(asOfDate).then((s) => { if (alive) { setSheet(s); setLoading(false); } });
    return () => { alive = false; };
  }, [repo, asOfDate]);
  return { sheet, loading };
}
