import { supabase } from "@shared/lib/supabase";
import type {
  Payroll, PayrollFormData, PayrollListResult, IPayrollRepository, Result, PayrollDeduction, WorkerType,
} from "@finance/domain/payroll.types";

type Emp = { full_name: string } | null;
type Cat = { label: string } | null;
interface Row {
  id: string; tenant_id: string; employee_id: string; amount: number | string;
  period: string; payment_method_id: string; pay_date: string; notes: string | null;
  created_by: string; created_at: string; evidence_urls: unknown; employee: Emp; paymentMethod: Cat;
  worker_type: WorkerType; gross_salary: number | string; net_salary: number | string;
  total_employer_cost: number | string; deductions_employee: unknown; contributions_employer: unknown;
}

const SELECT =
  "id, tenant_id, employee_id, amount, period, payment_method_id, pay_date, notes, created_by, created_at, evidence_urls," +
  " worker_type, gross_salary, net_salary, total_employer_cost, deductions_employee, contributions_employer," +
  " employee:profiles!payroll_employee_id_fkey(full_name)," +
  " paymentMethod:categories!payroll_payment_method_id_fkey(label)";

const arr = (v: unknown): PayrollDeduction[] => (Array.isArray(v) ? (v as PayrollDeduction[]) : []);

function toPayroll(r: Row): Payroll {
  return {
    id: r.id, tenantId: r.tenant_id, employeeId: r.employee_id, employeeName: r.employee?.full_name ?? "",
    amount: Number(r.amount), period: r.period, paymentMethodId: r.payment_method_id,
    paymentMethodLabel: r.paymentMethod?.label ?? "", date: r.pay_date, notes: r.notes ?? "",
    createdBy: r.created_by, createdAt: r.created_at,
    evidenceUrls: Array.isArray(r.evidence_urls) ? (r.evidence_urls as string[]) : [],
    workerType: r.worker_type, grossSalary: Number(r.gross_salary), netSalary: Number(r.net_salary),
    totalEmployerCost: Number(r.total_employer_cost),
    deductionsEmployee: arr(r.deductions_employee), contributionsEmployer: arr(r.contributions_employer),
  };
}

// Calcula deducciones vía RPC (tenant por default) y arma la fila con los jsonb + totales.
async function buildRow(d: PayrollFormData) {
  const gross = d.grossSalary ?? d.amount;
  const worker = d.workerType ?? "employee";
  const { data } = await supabase.rpc("calculate_payroll_deductions", { p_gross: gross, p_worker_type: worker });
  const c = data as { net_salary?: number; total_employer_cost?: number; employee_deductions?: unknown; employer_contributions?: unknown } | null;
  return {
    employee_id: d.employeeId, amount: gross, period: d.period, payment_method_id: d.paymentMethodId,
    pay_date: d.date, notes: d.notes, evidence_urls: d.evidenceUrls ?? [], worker_type: worker, gross_salary: gross,
    deductions_employee: c?.employee_deductions ?? [], contributions_employer: c?.employer_contributions ?? [],
    net_salary: c?.net_salary ?? gross, total_employer_cost: c?.total_employer_cost ?? gross,
  };
}

export const supabasePayrollRepository: IPayrollRepository = {
  async list(): Promise<PayrollListResult> {
    const { data, error } = await supabase.from("payroll").select(SELECT).order("pay_date", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as unknown as Row[]).map(toPayroll) };
  },
  async create(d): Promise<Result<Payroll, string>> {
    const { data, error } = await supabase.from("payroll").insert(await buildRow(d)).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toPayroll(data as unknown as Row) };
  },
  async update(id, d): Promise<Result<Payroll, string>> {
    const { data, error } = await supabase.from("payroll").update(await buildRow(d)).eq("id", id).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toPayroll(data as unknown as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("payroll").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
};
