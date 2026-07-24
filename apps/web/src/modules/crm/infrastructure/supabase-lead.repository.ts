import { supabase } from "@shared/lib/supabase";
import type { Lead, LeadFormData, LeadItem, LeadListResult, ILeadRepository, Result } from "@crm/domain/lead.types";

type Ref = { label: string } | null;
type ItemRow = { description: string; quantity: number | string; unit_price: number | string;
  tax_pct: number | string; discount_pct: number | string; line_total: number | string };
interface Row {
  id: string; tenant_id: string; contact_name: string; phone: string; email: string | null;
  address: string | null; city: string | null; zip_code: string | null;
  lead_source: string | null; service_requested: string | null;
  lead_source_id: string | null; service_type_id: string | null;
  temperature: string; status: string; call_date: string; notes: string | null; custom_fields: unknown;
  quoted_price: number | string | null; created_at: string; evidence_urls: unknown; customer_id: string | null; campaign_page_id: string | null; attribution: unknown;
  source: Ref; service: Ref; items: ItemRow[] | null;
}

const SELECT =
  "id, tenant_id, contact_name, phone, email, address, city, zip_code, lead_source, service_requested," +
  " lead_source_id, service_type_id, temperature, status, call_date, notes, custom_fields, quoted_price, created_at, evidence_urls, customer_id, campaign_page_id, attribution," +
  " source:categories!leads_lead_source_id_fkey(label), service:categories!leads_service_type_id_fkey(label)," +
  " items:lead_items(description, quantity, unit_price, tax_pct, discount_pct, line_total)";

function toItem(i: ItemRow): LeadItem {
  return { description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unit_price),
    taxPct: Number(i.tax_pct), discountPct: Number(i.discount_pct), lineTotal: Number(i.line_total) };
}

function toLead(r: Row): Lead {
  return {
    id: r.id, tenantId: r.tenant_id, contactName: r.contact_name, phone: r.phone, email: r.email ?? "",
    address: r.address ?? "", city: r.city ?? "", zipCode: r.zip_code ?? "",
    leadSource: r.lead_source ?? "", serviceRequested: r.service_requested ?? "",
    leadSourceId: r.lead_source_id ?? "", leadSourceLabel: r.source?.label ?? "",
    serviceTypeId: r.service_type_id ?? "", serviceTypeLabel: r.service?.label ?? "",
    temperature: r.temperature, status: r.status, callDate: r.call_date, notes: r.notes ?? "",
    customFields: (Array.isArray(r.custom_fields) ? r.custom_fields : []) as Lead["customFields"],
    quotedPrice: Number(r.quoted_price ?? 0), createdAt: r.created_at,
    evidenceUrls: Array.isArray(r.evidence_urls) ? (r.evidence_urls as string[]) : [],
    items: Array.isArray(r.items) ? r.items.map(toItem) : [], customerId: r.customer_id ?? null,
    campaignPageId: r.campaign_page_id ?? null, attribution: (r.attribution as Record<string, string>) ?? null };
}

function leadJson(id: string | null, d: LeadFormData) {
  return { id, contact_name: d.contactName, phone: d.phone, email: d.email,
    address: d.address ?? "", city: d.city ?? "", zip_code: d.zipCode ?? "",
    lead_source_id: d.leadSourceId ?? "", service_type_id: d.serviceTypeId ?? "",
    temperature: d.temperature, status: d.status, call_date: d.callDate, notes: d.notes,
    quoted_price: d.quotedPrice ?? "", evidence_urls: d.evidenceUrls ?? [], customer_id: d.customerId ?? "" };
}

function itemsJson(d: LeadFormData) {
  return (d.items ?? []).map((i) => ({ description: i.description, quantity: i.quantity,
    unit_price: i.unitPrice, tax_pct: i.taxPct, discount_pct: i.discountPct }));
}

async function save(id: string | null, d: LeadFormData): Promise<Result<null, string>> {
  const { error } = await supabase.rpc("save_lead_with_items", { lead: leadJson(id, d), items: itemsJson(d) });
  return error ? { ok: false, error: error.message } : { ok: true, value: null };
}

export const supabaseLeadRepository: ILeadRepository = {
  async list(): Promise<LeadListResult> {
    const { data, error } = await supabase.from("leads").select(SELECT).order("call_date", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as unknown as Row[]).map(toLead) };
  },
  create: (d) => save(null, d),
  update: (id, d) => save(id, d),
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
};
