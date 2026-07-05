import { supabase } from "@shared/lib/supabase";
import type { Budget, BudgetFormData, BudgetListResult, IBudgetRepository, Result } from "@crm/domain/marketing.types";

interface Row {
  id: string; tenant_id: string; month: string; channel: string;
  budgeted_amount: number | string; notes: string | null;
}

const SELECT = "id, tenant_id, month, channel, budgeted_amount, notes";

function toBudget(r: Row): Budget {
  return { id: r.id, tenantId: r.tenant_id, month: r.month, channel: r.channel,
    budgetedAmount: Number(r.budgeted_amount), notes: r.notes ?? "" };
}

function toRow(d: BudgetFormData) {
  return { month: d.month, channel: d.channel, budgeted_amount: d.budgetedAmount, notes: d.notes };
}

export const supabaseBudgetRepository: IBudgetRepository = {
  async list(): Promise<BudgetListResult> {
    const { data, error } = await supabase.from("marketing_budgets").select(SELECT).order("month", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as unknown as Row[]).map(toBudget) };
  },
  async save(id, d): Promise<Result<null, string>> {
    const { error } = id
      ? await supabase.from("marketing_budgets").update(toRow(d)).eq("id", id)
      : await supabase.from("marketing_budgets").insert(toRow(d));
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
  async upsert(d): Promise<Result<null, string>> {
    const { error } = await supabase.from("marketing_budgets")
      .upsert(toRow(d), { onConflict: "tenant_id,month,channel" });
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("marketing_budgets").delete().eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
};
