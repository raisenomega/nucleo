import { useCallback, useEffect, useState } from "react";
import type { Budget, BudgetFormData, IBudgetRepository } from "@crm/domain/marketing.types";
import type { MarketingExpense, MExpenseFormData, IMExpenseRepository } from "@crm/domain/marketing.types";

// DI de ambos repos (budgets + expenses) — NO importa infrastructure (A9 + oráculo #3).
export function useMarketing(budgetRepo: IBudgetRepository, expenseRepo: IMExpenseRepository) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<MarketingExpense[]>([]);

  const refresh = useCallback(async () => {
    const [b, e] = await Promise.all([budgetRepo.list(), expenseRepo.list()]);
    setBudgets(b.ok ? b.value : []);
    setExpenses(e.ok ? e.value : []);
  }, [budgetRepo, expenseRepo]);

  useEffect(() => { void refresh(); }, [refresh]);

  const saveBudget = useCallback(async (id: string | null, d: BudgetFormData) => {
    const r = await budgetRepo.save(id, d); if (r.ok) await refresh(); return r;
  }, [budgetRepo, refresh]);
  const removeBudget = useCallback(async (id: string) => {
    const r = await budgetRepo.remove(id); if (r.ok) await refresh(); return r;
  }, [budgetRepo, refresh]);
  const saveExpense = useCallback(async (id: string | null, d: MExpenseFormData) => {
    const r = await expenseRepo.save(id, d); if (r.ok) await refresh(); return r;
  }, [expenseRepo, refresh]);
  const removeExpense = useCallback(async (id: string) => {
    const r = await expenseRepo.remove(id); if (r.ok) await refresh(); return r;
  }, [expenseRepo, refresh]);

  return { budgets, expenses, saveBudget, removeBudget, saveExpense, removeExpense };
}
