import { supabase } from "@shared/lib/supabase";
import type {
  ExternalWorker, ExternalWorkerFormData, ExternalWorkerListResult,
  IExternalWorkerRepository, ExternalWorkerType,
} from "@finance/domain/external-worker.types";
import type { Result } from "@finance/domain/payroll.types";

const SELECT = "id, full_name, worker_type, tax_id, contact, notes, active";
interface Row {
  id: string; full_name: string; worker_type: string;
  tax_id: string | null; contact: string | null; notes: string | null; active: boolean;
}
const toWorker = (r: Row): ExternalWorker => ({
  id: r.id, fullName: r.full_name, workerType: r.worker_type as ExternalWorkerType,
  taxId: r.tax_id ?? "", contact: r.contact ?? "", notes: r.notes ?? "", active: r.active,
});
const toRow = (d: ExternalWorkerFormData) => ({
  full_name: d.fullName, worker_type: d.workerType, tax_id: d.taxId || null,
  contact: d.contact || null, notes: d.notes || null, active: d.active,
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
