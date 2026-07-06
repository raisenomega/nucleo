import { supabase } from "@shared/lib/supabase";
import type {
  IReconciliationRepository, ReconciliationSnapshot, RetentionDeposit, RetentionDepositFormData,
} from "@finance/domain/reconciliation.types";
import type {
  MonthlySeriesRow, ExpenseBreakdownRow, OperatingStatus,
} from "@finance/domain/reconciliation-health.types";
import type { RepoResult } from "@finance/domain/bank-account.types";

interface RawObl { label: string; calcType: string; rate: number; base: number; estimated: number; frequency: string; notes: string; }
interface RawHealth {
  total_out: number; break_even: number; break_even_pct: number; shortfall: number; surplus: number;
  operating_margin: number; operating_status: OperatingStatus; trend: MonthlySeriesRow[];
}
interface Raw {
  bank_panel: { accounts: { bankName: string; openingBalance: number; realBalance: number; cutoffDate: string }[];
    opening_balance: number; deposits: number; egresos: number; calculated_balance: number; real_balance: number; difference: number };
  tax_panel: { obligations: RawObl[]; total_estimated: number };
  retention_panel: { retention_pct: number; required: number; monthly: MonthlySeriesRow[] };
  summary_panel: {
    total_income: number; total_expenses: number; total_payroll: number; total_extraordinary: number; total_marketing: number;
    operating_profit: number; tax_estimated: number; retention_required: number; available_balance: number;
    status: "healthy" | "tight" | "at_risk"; expense_breakdown: ExpenseBreakdownRow[]; health: RawHealth;
  };
}

const N = Number;
function period(month: string) { const [y, m] = month.split("-"); return { py: N(y), pm: N(m) }; }

function map(r: Raw): ReconciliationSnapshot {
  const b = r.bank_panel, tx = r.tax_panel, rt = r.retention_panel, s = r.summary_panel, h = s.health;
  return {
    bank: { accounts: (b.accounts ?? []).map((a) => ({ ...a, balance: N(a.realBalance) })),
      openingBalance: N(b.opening_balance), deposits: N(b.deposits), egresos: N(b.egresos),
      calculatedBalance: N(b.calculated_balance), realBalance: N(b.real_balance), difference: N(b.difference),
      totalBank: N(b.real_balance), totalSystem: N(s.total_income) - N(s.total_expenses) },
    tax: { obligations: (tx.obligations ?? []).map((o) => ({ ...o, rate: N(o.rate), base: N(o.base), estimated: N(o.estimated) })), totalEstimated: N(tx.total_estimated) },
    retention: { retentionPct: N(rt.retention_pct), required: N(rt.required), monthly: rt.monthly ?? [], deposited: 0, pending: N(rt.required) },
    summary: { totalIncome: N(s.total_income), totalExpenses: N(s.total_expenses), totalPayroll: N(s.total_payroll),
      totalExtraordinary: N(s.total_extraordinary), totalMarketing: N(s.total_marketing), operatingProfit: N(s.operating_profit),
      taxEstimated: N(s.tax_estimated), retentionRequired: N(s.retention_required), availableBalance: N(s.available_balance), status: s.status,
      expenseBreakdown: s.expense_breakdown ?? [],
      health: { totalOut: N(h.total_out), breakEven: N(h.break_even), breakEvenPct: N(h.break_even_pct),
        shortfall: N(h.shortfall), surplus: N(h.surplus), operatingMargin: N(h.operating_margin),
        operatingStatus: h.operating_status, trend: h.trend ?? [] } },
  };
}

export const supabaseReconciliationRepository: IReconciliationRepository = {
  async getSnapshot(month) {
    const { data, error } = await supabase.rpc("get_reconciliation_snapshot", { p_month: `${month}-01` });
    if (error || !data) return null;
    return map(data as unknown as Raw);
  },
  async listDeposits(month): Promise<readonly RetentionDeposit[]> {
    const { py, pm } = period(month);
    const { data } = await supabase.from("retention_deposits").select("id, amount, deposit_date, notes")
      .eq("period_year", py).eq("period_month", pm).order("deposit_date", { ascending: false });
    return ((data as { id: string; amount: number; deposit_date: string; notes: string | null }[] | null) ?? [])
      .map((d) => ({ id: d.id, amount: N(d.amount), depositDate: d.deposit_date, notes: d.notes ?? "" }));
  },
  async addDeposit(month, d: RetentionDepositFormData): Promise<RepoResult> {
    const { py, pm } = period(month);
    const { error } = await supabase.from("retention_deposits")
      .insert({ period_year: py, period_month: pm, amount: d.amount, deposit_date: d.depositDate, notes: d.notes });
    return error ? { ok: false, error: error.message } : { ok: true };
  },
};
