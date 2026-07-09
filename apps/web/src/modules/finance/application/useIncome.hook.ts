import { useCallback, useEffect, useState } from "react";
import type { Income, IncomeFormData, IIncomeRepository } from "@finance/domain/income.types";

// Recibe el repositorio por inyección (DI) — NO importa infrastructure (A9 + oráculo #3).
export function useIncome(repo: IIncomeRepository) {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const r = await repo.list();
    setIncomes(r.ok ? r.value : []);
    setIsLoading(false);
  }, [repo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (d: IncomeFormData) => {
    const r = await repo.create(d);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  const update = useCallback(async (id: string, d: IncomeFormData) => {
    const r = await repo.update(id, d);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  const voidRow = useCallback(async (id: string, reason: string) => {
    const r = await repo.voidRow(id, reason);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  const remove = useCallback(async (id: string) => {
    const r = await repo.remove(id);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  return { incomes, isLoading, create, update, voidRow, remove, refresh };
}
