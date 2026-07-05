import { useCallback, useEffect, useState } from "react";
import type { Budget, BudgetFormData, IBudgetRepository } from "@crm/domain/marketing.types";
import type { MarketingExpense, MExpenseFormData, IMExpenseRepository } from "@crm/domain/marketing.types";
import type { MarketingSnapshot, IMarketingSnapshotRepository } from "@crm/domain/marketing.types";

// DI de los 3 repos (budgets, expenses, snapshot). El snapshot es del `month` (yyyy-mm) seleccionado.
export function useMarketing(
  budgetRepo: IBudgetRepository, expenseRepo: IMExpenseRepository,
  snapshotRepo: IMarketingSnapshotRepository, month: string,
) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<MarketingExpense[]>([]);
  const [snapshot, setSnapshot] = useState<MarketingSnapshot | null>(null);

  const refresh = useCallback(async () => {
    const [b, e, s] = await Promise.all([budgetRepo.list(), expenseRepo.list(), snapshotRepo.getSnapshot(month)]);
    setBudgets(b.ok ? b.value : []);
    setExpenses(e.ok ? e.value : []);
    setSnapshot(s);
  }, [budgetRepo, expenseRepo, snapshotRepo, month]);

  useEffect(() => { void refresh(); }, [refresh]);

  const upsertBudget = useCallback(async (d: BudgetFormData) => {
    const r = await budgetRepo.upsert(d); if (r.ok) await refresh(); return r;
  }, [budgetRepo, refresh]);
  const saveExpense = useCallback(async (id: string | null, d: MExpenseFormData) => {
    const r = await expenseRepo.save(id, d); if (r.ok) await refresh(); return r;
  }, [expenseRepo, refresh]);
  const removeExpense = useCallback(async (id: string) => {
    const r = await expenseRepo.remove(id); if (r.ok) await refresh(); return r;
  }, [expenseRepo, refresh]);

  return { budgets, expenses, snapshot, upsertBudget, saveExpense, removeExpense };
}
