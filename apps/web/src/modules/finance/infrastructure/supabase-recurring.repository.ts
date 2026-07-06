import { supabase } from "@shared/lib/supabase";
import type {
  RecurringExpense, RecurringExpenseFormData, IRecurringRepository, RecurringFrequency,
} from "@finance/domain/recurring-expense.types";
import type { RepoResult } from "@finance/domain/bank-account.types";

interface Row {
  id: string; tenant_id: string; category_id: string; label: string;
  budgeted_amount: number | string; frequency: RecurringFrequency; active: boolean; category: { label: string } | null;
}
const SELECT = "id, tenant_id, category_id, label, budgeted_amount, frequency, active," +
  " category:categories!recurring_expenses_category_id_fkey(label)";

function toEntity(r: Row): RecurringExpense {
  return { id: r.id, tenantId: r.tenant_id, categoryId: r.category_id, categoryLabel: r.category?.label ?? "",
    label: r.label, budgetedAmount: Number(r.budgeted_amount), frequency: r.frequency, active: r.active };
}
function toRow(d: RecurringExpenseFormData) {
  return { category_id: d.categoryId, label: d.label, budgeted_amount: d.budgetedAmount, frequency: d.frequency };
}
function range(month: string) {
  const y = Number(month.slice(0, 4)), m = Number(month.slice(5, 7));
  return { m0: `${month}-01`, m1: new Date(y, m, 1).toISOString().slice(0, 10) };
}

export const supabaseRecurringRepository: IRecurringRepository = {
  async list(): Promise<readonly RecurringExpense[]> {
    const { data } = await supabase.from("recurring_expenses").select(SELECT).eq("active", true).order("label");
    return ((data as unknown as Row[] | null) ?? []).map(toEntity);
  },
  async create(d): Promise<RepoResult> {
    const { error } = await supabase.from("recurring_expenses").insert(toRow(d));
    return error ? { ok: false, error: error.message } : { ok: true };
  },
  async update(id, d): Promise<RepoResult> {
    const { error } = await supabase.from("recurring_expenses").update(toRow(d)).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  },
  async remove(id): Promise<RepoResult> {
    const { error } = await supabase.from("recurring_expenses").update({ active: false }).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  },
  async getPaidStatus(month): Promise<Record<string, number>> {
    const { m0, m1 } = range(month);
    const { data } = await supabase.from("expenses").select("category_id, amount")
      .gte("expense_date", m0).lt("expense_date", m1).is("deleted_at", null);
    const map: Record<string, number> = {};
    for (const e of (data as { category_id: string; amount: number }[] | null) ?? [])
      map[e.category_id] = (map[e.category_id] ?? 0) + Number(e.amount);
    return map;
  },
};
