import { useCallback, useEffect, useState } from "react";
import type {
  RecurringExpense, RecurringExpenseFormData, IRecurringRepository,
} from "@finance/domain/recurring-expense.types";

// DI del repo. Carga la lista + el pagado del mes (yyyy-mm) en paralelo.
export function useRecurringExpenses(repo: IRecurringRepository, month: string) {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [paid, setPaid] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [l, p] = await Promise.all([repo.list(), repo.getPaidStatus(month)]);
    setItems([...l]); setPaid(p); setLoading(false);
  }, [repo, month]);

  useEffect(() => { void refresh(); }, [refresh]);

  const save = useCallback(async (id: string | null, d: RecurringExpenseFormData) => {
    const r = id ? await repo.update(id, d) : await repo.create(d);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);
  const remove = useCallback(async (id: string) => {
    const r = await repo.remove(id); if (r.ok) await refresh(); return r;
  }, [repo, refresh]);

  return { items, paid, loading, save, remove, refresh };
}
