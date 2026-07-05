import { supabase } from "@shared/lib/supabase";
import type {
  Expense, ExpenseFormData, ExpenseListResult, IExpenseRepository, Result,
} from "@finance/domain/expense.types";

type Cat = { label: string } | null;
interface Row {
  id: string; tenant_id: string; category_id: string; payment_method_id: string;
  amount: number | string; expense_date: string; notes: string | null;
  created_by: string; created_at: string; category: Cat; paymentMethod: Cat;
  evidence_urls: unknown;
}

const SELECT =
  "id, tenant_id, category_id, payment_method_id, amount, expense_date, notes, created_by, created_at, evidence_urls," +
  " category:categories!expenses_category_id_fkey(label)," +
  " paymentMethod:categories!expenses_payment_method_id_fkey(label)";

function toExpense(r: Row): Expense {
  return {
    id: r.id, tenantId: r.tenant_id, categoryId: r.category_id,
    categoryLabel: r.category?.label ?? "", amount: Number(r.amount),
    description: r.notes ?? "", date: r.expense_date,
    paymentMethodId: r.payment_method_id, paymentMethodLabel: r.paymentMethod?.label ?? "",
    createdBy: r.created_by, createdAt: r.created_at,
    evidenceUrls: Array.isArray(r.evidence_urls) ? (r.evidence_urls as string[]) : [],
  };
}

function toRow(d: ExpenseFormData) {
  return {
    category_id: d.categoryId, payment_method_id: d.paymentMethodId,
    amount: d.amount, expense_date: d.date, notes: d.description,
    evidence_urls: d.evidenceUrls ?? [],
  };
}

export const supabaseExpenseRepository: IExpenseRepository = {
  async list(): Promise<ExpenseListResult> {
    const { data, error } = await supabase.from("expenses").select(SELECT)
      .order("expense_date", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as unknown as Row[]).map(toExpense) };
  },
  async create(d): Promise<Result<Expense, string>> {
    const { data, error } = await supabase.from("expenses").insert(toRow(d)).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toExpense(data as unknown as Row) };
  },
  async update(id, d): Promise<Result<Expense, string>> {
    const { data, error } = await supabase.from("expenses").update(toRow(d)).eq("id", id).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toExpense(data as unknown as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
};
