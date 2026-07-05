import { supabase } from "@shared/lib/supabase";
import type {
  MarketingExpense, MExpenseFormData, MExpenseListResult, IMExpenseRepository, Result,
} from "@crm/domain/marketing.types";

interface Row {
  id: string; tenant_id: string; budget_id: string | null; channel: string; expense_date: string;
  amount: number | string; description: string; campaign_name: string | null; notes: string | null;
  evidence_urls: unknown;
}

const SELECT = "id, tenant_id, budget_id, channel, expense_date, amount, description, campaign_name, notes, evidence_urls";

function toExpense(r: Row): MarketingExpense {
  return {
    id: r.id, tenantId: r.tenant_id, budgetId: r.budget_id ?? "", channel: r.channel,
    date: r.expense_date, amount: Number(r.amount), description: r.description,
    campaignName: r.campaign_name ?? "", notes: r.notes ?? "",
    evidenceUrls: Array.isArray(r.evidence_urls) ? (r.evidence_urls as string[]) : [],
  };
}

function toRow(d: MExpenseFormData) {
  return {
    budget_id: d.budgetId || null, channel: d.channel, expense_date: d.date, amount: d.amount,
    description: d.description, campaign_name: d.campaignName, notes: d.notes, evidence_urls: d.evidenceUrls ?? [],
  };
}

export const supabaseMExpenseRepository: IMExpenseRepository = {
  async list(): Promise<MExpenseListResult> {
    const { data, error } = await supabase.from("marketing_expenses").select(SELECT)
      .is("deleted_at", null).order("expense_date", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as unknown as Row[]).map(toExpense) };
  },
  async save(id, d): Promise<Result<null, string>> {
    const { error } = id
      ? await supabase.from("marketing_expenses").update(toRow(d)).eq("id", id)
      : await supabase.from("marketing_expenses").insert(toRow(d));
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("marketing_expenses").delete().eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
};
