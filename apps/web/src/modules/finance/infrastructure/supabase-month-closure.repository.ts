import { supabase } from "@shared/lib/supabase";
import type { IMonthClosureRepository, MonthClosure, MonthRecStatus, MonthTotals, RepoResult } from "@finance/domain/month-closure.types";

const N = Number;
const nn = (v: unknown) => (v == null ? null : Number(v));
const ok = (e: { message: string } | null): RepoResult => (e ? { ok: false, error: e.message } : { ok: true });

// Errores de las RPCs (NOT_AUTHORIZED, ALREADY_CLOSED, ...) llegan como error.message → se muestran al usuario.
export const supabaseMonthClosureRepository: IMonthClosureRepository = {
  async listClosures() {
    const { data } = await supabase.from("month_closures")
      .select("period_year, period_month, total_income, total_expenses, total_payroll, total_extraordinary, net_balance, closed_by, closed_at, bank_balance, reconciliation_diff")
      .order("period_year", { ascending: false }).order("period_month", { ascending: false });
    return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({
      periodYear: r.period_year as number, periodMonth: r.period_month as number,
      totalIncome: N(r.total_income), totalExpenses: N(r.total_expenses), totalPayroll: N(r.total_payroll),
      totalExtraordinary: N(r.total_extraordinary), netBalance: N(r.net_balance),
      closedBy: r.closed_by as string, closedAt: r.closed_at as string,
      bankBalance: nn(r.bank_balance), reconciliationDiff: nn(r.reconciliation_diff),
    })) as MonthClosure[];
  },
  async recStatus() {
    const { data } = await supabase.rpc("list_reconciliation_status");
    return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({
      periodYear: N(r.period_year), periodMonth: N(r.period_month), totalLines: N(r.total_lines),
      matched: N(r.matched), unmatched: N(r.unmatched), unmatchedAmount: N(r.unmatched_amount),
    })) as MonthRecStatus[];
  },
  async preview(year, month) {
    const { data } = await supabase.rpc("preview_month_close", { p_year: year, p_month: month });
    if (!data) return null;
    const d = data as Record<string, unknown>;
    return {
      totalIncome: N(d.total_income), totalExpenses: N(d.total_expenses), totalPayroll: N(d.total_payroll),
      totalExtraordinary: N(d.total_extraordinary),
      netBalance: N(d.total_income) - N(d.total_expenses) - N(d.total_payroll) - N(d.total_extraordinary),
    } as MonthTotals;
  },
  async close(year, month) { return ok((await supabase.rpc("close_month", { p_year: year, p_month: month })).error); },
  async reopen(year, month, reason) { return ok((await supabase.rpc("reopen_month", { p_year: year, p_month: month, p_reason: reason })).error); },
};
