import { useEffect, useState } from "react";
import type { CashFlowStatement, StatementFilters, IFinancialStatementsRepository } from "@accounting/domain/financial-statements.types";

// DI del repo. Carga el estado de flujo de efectivo según los filtros de período.
export function useCashFlow(repo: IFinancialStatementsRepository, filters: StatementFilters) {
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const { year, monthFrom, monthTo } = filters;
  useEffect(() => {
    let alive = true;
    setLoading(true);
    void repo.getCashFlow({ year, monthFrom, monthTo }).then((c) => { if (alive) { setCashFlow(c); setLoading(false); } });
    return () => { alive = false; };
  }, [repo, year, monthFrom, monthTo]);
  return { cashFlow, loading };
}
