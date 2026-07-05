import { supabase } from "@shared/lib/supabase";
import type {
  Payroll, PayrollFormData, PayrollListResult, IPayrollRepository, Result,
} from "@finance/domain/payroll.types";

type Emp = { full_name: string } | null;
type Cat = { label: string } | null;
interface Row {
  id: string; tenant_id: string; employee_id: string; amount: number | string;
  period: string; payment_method_id: string; pay_date: string; notes: string | null;
  created_by: string; created_at: string; evidence_urls: unknown; employee: Emp; paymentMethod: Cat;
}

const SELECT =
  "id, tenant_id, employee_id, amount, period, payment_method_id, pay_date, notes, created_by, created_at, evidence_urls," +
  " employee:profiles!payroll_employee_id_fkey(full_name)," +
  " paymentMethod:categories!payroll_payment_method_id_fkey(label)";

function toPayroll(r: Row): Payroll {
  return {
    id: r.id, tenantId: r.tenant_id, employeeId: r.employee_id, employeeName: r.employee?.full_name ?? "",
    amount: Number(r.amount), period: r.period, paymentMethodId: r.payment_method_id,
    paymentMethodLabel: r.paymentMethod?.label ?? "", date: r.pay_date, notes: r.notes ?? "",
    createdBy: r.created_by, createdAt: r.created_at,
    evidenceUrls: Array.isArray(r.evidence_urls) ? (r.evidence_urls as string[]) : [],
  };
}

function toRow(d: PayrollFormData) {
  return {
    employee_id: d.employeeId, amount: d.amount, period: d.period,
    payment_method_id: d.paymentMethodId, pay_date: d.date, notes: d.notes,
    evidence_urls: d.evidenceUrls ?? [],
  };
}

export const supabasePayrollRepository: IPayrollRepository = {
  async list(): Promise<PayrollListResult> {
    const { data, error } = await supabase.from("payroll").select(SELECT)
      .order("pay_date", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as unknown as Row[]).map(toPayroll) };
  },
  async create(d): Promise<Result<Payroll, string>> {
    const { data, error } = await supabase.from("payroll").insert(toRow(d)).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toPayroll(data as unknown as Row) };
  },
  async update(id, d): Promise<Result<Payroll, string>> {
    const { data, error } = await supabase.from("payroll").update(toRow(d)).eq("id", id).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toPayroll(data as unknown as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("payroll").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
};
