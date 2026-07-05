import { supabase } from "@shared/lib/supabase";
import type {
  ExtraPayment, ExtraPaymentFormData, ExtraPaymentListResult, IExtraPaymentRepository, Result,
} from "@finance/domain/extraordinary.types";

type Cat = { label: string } | null;
interface Row {
  id: string; tenant_id: string; category_id: string; payment_method_id: string;
  amount: number | string; payment_date: string; justification: string;
  created_by: string; created_at: string; category: Cat; paymentMethod: Cat;
  evidence_urls: unknown;
}

const SELECT =
  "id, tenant_id, category_id, payment_method_id, amount, payment_date, justification, created_by, created_at, evidence_urls," +
  " category:categories!extraordinary_payments_category_id_fkey(label)," +
  " paymentMethod:categories!extraordinary_payments_payment_method_id_fkey(label)";

function toExtra(r: Row): ExtraPayment {
  return {
    id: r.id, tenantId: r.tenant_id, categoryId: r.category_id,
    categoryLabel: r.category?.label ?? "", amount: Number(r.amount),
    justification: r.justification, date: r.payment_date,
    paymentMethodId: r.payment_method_id, paymentMethodLabel: r.paymentMethod?.label ?? "",
    createdBy: r.created_by, createdAt: r.created_at,
    evidenceUrls: Array.isArray(r.evidence_urls) ? (r.evidence_urls as string[]) : [],
  };
}

function toRow(d: ExtraPaymentFormData) {
  return {
    category_id: d.categoryId, payment_method_id: d.paymentMethodId,
    amount: d.amount, payment_date: d.date, justification: d.justification,
    evidence_urls: d.evidenceUrls ?? [],
  };
}

export const supabaseExtraordinaryRepository: IExtraPaymentRepository = {
  async list(): Promise<ExtraPaymentListResult> {
    const { data, error } = await supabase.from("extraordinary_payments").select(SELECT)
      .order("payment_date", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as unknown as Row[]).map(toExtra) };
  },
  async create(d): Promise<Result<ExtraPayment, string>> {
    const { data, error } = await supabase.from("extraordinary_payments").insert(toRow(d)).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toExtra(data as unknown as Row) };
  },
  async update(id, d): Promise<Result<ExtraPayment, string>> {
    const { data, error } = await supabase.from("extraordinary_payments").update(toRow(d)).eq("id", id).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toExtra(data as unknown as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("extraordinary_payments").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
};
