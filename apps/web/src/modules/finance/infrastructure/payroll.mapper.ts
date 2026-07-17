import type { Payroll, PayrollDeduction, WorkerType } from "@finance/domain/payroll.types";

type Emp = { full_name: string } | null;
type Cat = { label: string } | null;
export interface Row {
  id: string; tenant_id: string; employee_id: string | null; external_worker_id: string | null;
  amount: number | string; period: string; payment_method_id: string; pay_date: string; notes: string | null;
  created_by: string; created_at: string; evidence_urls: unknown; employee: Emp; externalWorker: Emp; paymentMethod: Cat;
  worker_type: WorkerType; gross_salary: number | string; net_salary: number | string;
  total_employer_cost: number | string; deductions_employee: unknown; contributions_employer: unknown;
}

export const PAYROLL_SELECT =
  "id, tenant_id, employee_id, external_worker_id, amount, period, payment_method_id, pay_date, notes, created_by, created_at, evidence_urls," +
  " worker_type, gross_salary, net_salary, total_employer_cost, deductions_employee, contributions_employer," +
  " employee:profiles!payroll_employee_id_fkey(full_name)," +
  " externalWorker:payroll_workers!payroll_external_worker_id_fkey(full_name)," +
  " paymentMethod:categories!payroll_payment_method_id_fkey(label)";

const arr = (v: unknown): PayrollDeduction[] => (Array.isArray(v) ? (v as PayrollDeduction[]) : []);

export function toPayroll(r: Row): Payroll {
  return {
    id: r.id, tenantId: r.tenant_id, employeeId: r.employee_id ?? "", externalWorkerId: r.external_worker_id ?? "",
    employeeName: r.employee?.full_name ?? r.externalWorker?.full_name ?? "",
    amount: Number(r.amount), period: r.period, paymentMethodId: r.payment_method_id,
    paymentMethodLabel: r.paymentMethod?.label ?? "", date: r.pay_date, notes: r.notes ?? "",
    createdBy: r.created_by, createdAt: r.created_at,
    evidenceUrls: Array.isArray(r.evidence_urls) ? (r.evidence_urls as string[]) : [],
    workerType: r.worker_type, grossSalary: Number(r.gross_salary), netSalary: Number(r.net_salary),
    totalEmployerCost: Number(r.total_employer_cost),
    deductionsEmployee: arr(r.deductions_employee), contributionsEmployer: arr(r.contributions_employer),
  };
}
