import { supabase } from "@shared/lib/supabase";
import type {
  Payroll, PayrollFormData, PayrollListResult, IPayrollRepository, Result, PayrollCalc, WorkerType,
} from "@finance/domain/payroll.types";
import { PAYROLL_SELECT as SELECT, toPayroll } from "@finance/infrastructure/payroll.mapper";

interface Calc { net_salary?: number; total_employer_cost?: number; total_employee_deductions?: number;
  total_employer_contributions?: number; employee_deductions?: unknown; employer_contributions?: unknown; }
const arr = (v: unknown) => (Array.isArray(v) ? (v as PayrollCalc["employeeDeductions"]) : []);

async function calc(gross: number, worker: WorkerType): Promise<Calc | null> {
  const { data } = await supabase.rpc("calculate_payroll_deductions", { p_gross: gross, p_worker_type: worker });
  return data as Calc | null;
}

// Calcula deducciones vía RPC (tenant por default) y arma la fila con los jsonb + totales.
async function buildRow(d: PayrollFormData) {
  const gross = d.grossSalary ?? d.amount;
  const worker = d.workerType ?? "employee";
  const c = await calc(gross, worker);
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
    return { ok: true, value: (data as unknown as Parameters<typeof toPayroll>[0][]).map(toPayroll) };
  },
  async create(d): Promise<Result<Payroll, string>> {
    const { data, error } = await supabase.from("payroll").insert(await buildRow(d)).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toPayroll(data as unknown as Parameters<typeof toPayroll>[0]) };
  },
  async update(id, d): Promise<Result<Payroll, string>> {
    const { data, error } = await supabase.from("payroll").update(await buildRow(d)).eq("id", id).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toPayroll(data as unknown as Parameters<typeof toPayroll>[0]) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("payroll").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
  async preview(gross, worker): Promise<PayrollCalc | null> {
    const c = await calc(gross, worker);
    if (!c) return null;
    return {
      gross, employeeDeductions: arr(c.employee_deductions), employerContributions: arr(c.employer_contributions),
      totalEmployeeDeductions: Number(c.total_employee_deductions ?? 0), totalEmployerContributions: Number(c.total_employer_contributions ?? 0),
      netSalary: Number(c.net_salary ?? gross), totalEmployerCost: Number(c.total_employer_cost ?? gross),
    };
  },
};
