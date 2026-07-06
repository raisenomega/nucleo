import { supabase } from "@shared/lib/supabase";
import type {
  IReconciliationRepository, ReconciliationSnapshot, RetentionDeposit, RetentionDepositFormData,
} from "@finance/domain/reconciliation.types";
import type { RepoResult } from "@finance/domain/bank-account.types";

interface RawObl { label: string; calcType: string; rate: number; base: number; estimated: number; frequency: string; notes: string; }
interface Raw {
  bank_panel: { accounts: { bankName: string; balance: number; cutoffDate: string }[]; total_bank: number; total_system: number; difference: number };
  tax_panel: { obligations: RawObl[]; total_estimated: number };
  retention_panel: { retention_pct: number; required: number; deposited: number; pending: number };
  summary_panel: Record<string, number> & { status: "healthy" | "tight" | "at_risk" };
}

const N = Number;
function period(month: string) { const [y, m] = month.split("-"); return { py: N(y), pm: N(m) }; }

function map(r: Raw): ReconciliationSnapshot {
  const b = r.bank_panel, tx = r.tax_panel, rt = r.retention_panel, s = r.summary_panel;
  return {
    bank: { accounts: b.accounts ?? [], totalBank: N(b.total_bank), totalSystem: N(b.total_system), difference: N(b.difference) },
    tax: { obligations: (tx.obligations ?? []).map((o) => ({ ...o, rate: N(o.rate), base: N(o.base), estimated: N(o.estimated) })), totalEstimated: N(tx.total_estimated) },
    retention: { retentionPct: N(rt.retention_pct), required: N(rt.required), deposited: N(rt.deposited), pending: N(rt.pending) },
    summary: {
      totalIncome: N(s.total_income), totalExpenses: N(s.total_expenses), totalPayroll: N(s.total_payroll),
      totalExtraordinary: N(s.total_extraordinary), totalMarketing: N(s.total_marketing), operatingProfit: N(s.operating_profit),
      taxEstimated: N(s.tax_estimated), retentionRequired: N(s.retention_required), availableBalance: N(s.available_balance), status: s.status,
    },
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
