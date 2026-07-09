import { supabase } from "@shared/lib/supabase";
import type {
  Income, IncomeFormData, IncomeListResult, IIncomeRepository, Result,
} from "@finance/domain/income.types";

type Cat = { label: string } | null;
interface Row {
  id: string; tenant_id: string; category_id: string; payment_method_id: string;
  amount: number | string; income_date: string; notes: string | null;
  client_reference: string | null; order_number: string | null;
  created_by: string; created_at: string; category: Cat; paymentMethod: Cat;
  evidence_urls: unknown;
  deleted_at: string | null; deleted_by: string | null; deleted_reason: string | null;
}

const SELECT =
  "id, tenant_id, category_id, payment_method_id, amount, income_date, notes, client_reference, order_number, created_by, created_at, evidence_urls, deleted_at, deleted_by, deleted_reason," +
  " category:categories!income_category_id_fkey(label)," +
  " paymentMethod:categories!income_payment_method_id_fkey(label)";

function toIncome(r: Row): Income {
  return {
    id: r.id, tenantId: r.tenant_id, categoryId: r.category_id,
    categoryLabel: r.category?.label ?? "", amount: Number(r.amount),
    description: r.notes ?? "", date: r.income_date,
    paymentMethodId: r.payment_method_id, paymentMethodLabel: r.paymentMethod?.label ?? "",
    clientReference: r.client_reference ?? "", orderNumber: r.order_number ?? "",
    createdBy: r.created_by, createdAt: r.created_at,
    evidenceUrls: Array.isArray(r.evidence_urls) ? (r.evidence_urls as string[]) : [],
    deletedAt: r.deleted_at, deletedBy: r.deleted_by, deletedReason: r.deleted_reason,
  };
}

function toRow(d: IncomeFormData) {
  return {
    category_id: d.categoryId, payment_method_id: d.paymentMethodId,
    amount: d.amount, income_date: d.date, notes: d.description,
    client_reference: d.clientReference, order_number: d.orderNumber,
    evidence_urls: d.evidenceUrls ?? [],
  };
}

export const supabaseIncomeRepository: IIncomeRepository = {
  async list(): Promise<IncomeListResult> {
    const { data, error } = await supabase.from("income").select(SELECT)
      .order("income_date", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as unknown as Row[]).map(toIncome) };
  },
  async create(d): Promise<Result<Income, string>> {
    const { data, error } = await supabase.from("income").insert(toRow(d)).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toIncome(data as unknown as Row) };
  },
  async update(id, d): Promise<Result<Income, string>> {
    const { data, error } = await supabase.from("income").update(toRow(d)).eq("id", id).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toIncome(data as unknown as Row) };
  },
  async voidRow(id, reason): Promise<Result<null, string>> {
    const { error } = await supabase.rpc("void_income", { p_id: id, p_reason: reason });
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("income").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
};
