import { supabase } from "@shared/lib/supabase";
import type { Lead, LeadFormData, LeadListResult, ILeadRepository, Result } from "@crm/domain/lead.types";

interface Row {
  id: string; tenant_id: string; contact_name: string; phone: string; email: string | null;
  service_requested: string; lead_source: string; temperature: string; status: string;
  call_date: string; notes: string | null; created_at: string; evidence_urls: unknown;
}

const SELECT =
  "id, tenant_id, contact_name, phone, email, service_requested, lead_source, temperature, status," +
  " call_date, notes, created_at, evidence_urls";

function toLead(r: Row): Lead {
  return {
    id: r.id, tenantId: r.tenant_id, contactName: r.contact_name, phone: r.phone, email: r.email ?? "",
    serviceRequested: r.service_requested, leadSource: r.lead_source, temperature: r.temperature,
    status: r.status, callDate: r.call_date, notes: r.notes ?? "", createdAt: r.created_at,
    evidenceUrls: Array.isArray(r.evidence_urls) ? (r.evidence_urls as string[]) : [],
  };
}

function toRow(d: LeadFormData) {
  return {
    contact_name: d.contactName, phone: d.phone, email: d.email || null,
    service_requested: d.serviceRequested, lead_source: d.leadSource, temperature: d.temperature,
    status: d.status, call_date: d.callDate, notes: d.notes, evidence_urls: d.evidenceUrls ?? [],
  };
}

export const supabaseLeadRepository: ILeadRepository = {
  async list(): Promise<LeadListResult> {
    const { data, error } = await supabase.from("leads").select(SELECT)
      .order("call_date", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as unknown as Row[]).map(toLead) };
  },
  async create(d): Promise<Result<Lead, string>> {
    const { data, error } = await supabase.from("leads").insert(toRow(d)).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toLead(data as unknown as Row) };
  },
  async update(id, d): Promise<Result<Lead, string>> {
    const { data, error } = await supabase.from("leads").update(toRow(d)).eq("id", id).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toLead(data as unknown as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
};
