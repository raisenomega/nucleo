import { supabase } from "@shared/lib/supabase";
import type {
  ExternalWorker, ExternalWorkerFormData, ExternalWorkerListResult,
  IExternalWorkerRepository, ExternalWorkerType, PaymentPreference,
} from "@finance/domain/external-worker.types";
import type { Result } from "@finance/domain/payroll.types";

const SELECT = "id, full_name, worker_type, phone, email, address, specialty, department, tax_id, hourly_rate, daily_rate, payment_preference, bank_account, notes, active";
interface Row {
  id: string; full_name: string; worker_type: string; phone: string | null; email: string | null;
  address: string | null; specialty: string | null; department: string | null; tax_id: string | null;
  hourly_rate: number | string | null; daily_rate: number | string | null;
  payment_preference: string | null; bank_account: string | null; notes: string | null; active: boolean;
}
const num = (v: number | string | null) => (v === null || v === "" ? null : Number(v));
const toWorker = (r: Row): ExternalWorker => ({
  id: r.id, fullName: r.full_name, workerType: r.worker_type as ExternalWorkerType,
  phone: r.phone ?? "", email: r.email ?? "", address: r.address ?? "", specialty: r.specialty ?? "",
  department: r.department ?? "", taxId: r.tax_id ?? "", hourlyRate: num(r.hourly_rate), dailyRate: num(r.daily_rate),
  paymentPreference: (r.payment_preference ?? "efectivo") as PaymentPreference, bankAccount: r.bank_account ?? "",
  notes: r.notes ?? "", active: r.active,
});
const toRow = (d: ExternalWorkerFormData) => ({
  full_name: d.fullName, worker_type: d.workerType, phone: d.phone || null, email: d.email || null,
  address: d.address || null, specialty: d.specialty || null, department: d.department || null,
  tax_id: d.taxId || null, hourly_rate: d.hourlyRate, daily_rate: d.dailyRate,
  payment_preference: d.paymentPreference, bank_account: d.bankAccount || null, notes: d.notes || null, active: d.active,
});

export const supabaseExternalWorkerRepository: IExternalWorkerRepository = {
  async list(): Promise<ExternalWorkerListResult> {
    const { data, error } = await supabase.from("payroll_workers").select(SELECT).order("full_name");
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as Row[]).map(toWorker) };
  },
  async create(d): Promise<Result<ExternalWorker, string>> {
    const { data, error } = await supabase.from("payroll_workers").insert(toRow(d)).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toWorker(data as Row) };
  },
  async update(id, d): Promise<Result<ExternalWorker, string>> {
    const { data, error } = await supabase.from("payroll_workers").update(toRow(d)).eq("id", id).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toWorker(data as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("payroll_workers").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
};
