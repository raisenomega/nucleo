import { supabase } from "@shared/lib/supabase";
import type {
  IDashboardRepository, RecentItem, Snapshot, CrmSnapshot, RecentLead, MktSnapshot,
} from "@finance/domain/dashboard.types";

interface Raw {
  total_income: number; total_expenses: number; balance: number;
  income_count: number; expense_count: number;
  top_income_category: string | null; top_expense_category: string | null;
  recent_income: RecentItem[]; recent_expenses: RecentItem[];
}

interface RawCrm {
  total_leads: number; total_quoted: number; conversion_rate: number;
  by_temperature: { hot: number; warm: number; cold: number };
  by_status: Record<string, number>; recent_leads: RecentLead[];
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
  async getCrmSnapshot(month?: Date): Promise<CrmSnapshot | null> {
    const args = month ? { p_month: month.toISOString().slice(0, 10) } : {};
    const { data, error } = await supabase.rpc("get_crm_snapshot", args);
    if (error || !data) return null;
    const r = data as unknown as RawCrm;
    return {
      totalLeads: Number(r.total_leads), totalQuoted: Number(r.total_quoted),
      conversionRate: Number(r.conversion_rate), byTemperature: r.by_temperature,
      byStatus: r.by_status, recentLeads: r.recent_leads ?? [],
    };
  },
  async getMarketingSnapshot(month?: Date): Promise<MktSnapshot | null> {
    const args = month ? { p_month: month.toISOString().slice(0, 10) } : {};
    const { data, error } = await supabase.rpc("get_marketing_snapshot", args);
    if (error || !data) return null;
    const r = data as unknown as { executed_pct: number; total_budget: number; total_spent: number };
    return { executedPct: Number(r.executed_pct), totalBudget: Number(r.total_budget), totalSpent: Number(r.total_spent) };
  },
};
