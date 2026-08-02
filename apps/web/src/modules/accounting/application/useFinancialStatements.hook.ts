import { useEffect, useState } from "react";
import type { IncomeStatement, StatementFilters, IFinancialStatementsRepository } from "@accounting/domain/financial-statements.types";

// DI del repo. Carga el estado de resultados según los filtros de período.
export function useFinancialStatements(repo: IFinancialStatementsRepository, filters: StatementFilters) {
  const [statement, setStatement] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { year, monthFrom, monthTo } = filters;
  useEffect(() => {
    let alive = true;
    setLoading(true);
    void repo.getIncomeStatement({ year, monthFrom, monthTo }).then((r) => { if (!alive) return;
      setStatement(r.ok ? r.value : null); setError(r.ok ? null : r.error); setLoading(false); });
    return () => { alive = false; };
  }, [repo, year, monthFrom, monthTo]);
  return { statement, loading, error };
}
