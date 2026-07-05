import { supabase } from "@shared/lib/supabase";
import type { IDashboardRepository, RecentItem, Snapshot } from "@finance/domain/dashboard.types";

interface Raw {
  total_income: number; total_expenses: number; balance: number;
  income_count: number; expense_count: number;
  top_income_category: string | null; top_expense_category: string | null;
  recent_income: RecentItem[]; recent_expenses: RecentItem[];
}

export const supabaseDashboardRepository: IDashboardRepository = {
  async getSnapshot(month?: Date): Promise<Snapshot | null> {
    const args = month ? { p_month: month.toISOString().slice(0, 10) } : {};
    const { data, error } = await supabase.rpc("get_financial_snapshot", args);
    if (error || !data) return null;
    const r = data as unknown as Raw;
    return {
      totalIncome: Number(r.total_income), totalExpenses: Number(r.total_expenses), balance: Number(r.balance),
      incomeCount: Number(r.income_count), expenseCount: Number(r.expense_count),
      topIncomeCategory: r.top_income_category, topExpenseCategory: r.top_expense_category,
      recentIncome: r.recent_income ?? [], recentExpenses: r.recent_expenses ?? [],
    };
  },
};
