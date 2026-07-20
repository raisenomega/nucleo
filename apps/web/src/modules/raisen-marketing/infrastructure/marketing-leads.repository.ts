import { supabase } from "@shared/lib/supabase";
import type { MarketingLead, LeadStatus, LeadTemperature, LeadEditFields } from "@raisen-marketing/data/lead-form.types";

const SEL = "id, lead_type, customer_name, customer_email, customer_phone, company, whatsapp_phone, business_type, message, source_url, utm_source, utm_medium, utm_campaign, status, temperature, notes, created_at";
const toLead = (o: Record<string, unknown>): MarketingLead => ({ id: o.id as string, leadType: o.lead_type as "business" | "partner", customerName: o.customer_name as string, customerEmail: o.customer_email as string, customerPhone: (o.customer_phone as string) ?? null, company: (o.company as string) ?? null, whatsappPhone: (o.whatsapp_phone as string) ?? null, businessType: (o.business_type as string) ?? null, message: (o.message as string) ?? null, sourceUrl: (o.source_url as string) ?? null, utmSource: (o.utm_source as string) ?? null, utmMedium: (o.utm_medium as string) ?? null, utmCampaign: (o.utm_campaign as string) ?? null, status: o.status as LeadStatus, temperature: (o.temperature as LeadTemperature) ?? "cold", notes: (o.notes as string) ?? null, createdAt: o.created_at as string });

// Carga todos los leads (superadmin); el inbox filtra en cliente (búsqueda/status/temp/tipo) como OMEGA.
export async function getLeads(): Promise<MarketingLead[]> {
  const { data } = await supabase.from("marketing_leads").select(SEL).order("created_at", { ascending: false });
  return ((data ?? []) as Record<string, unknown>[]).map(toLead);
}
export async function setLeadFields(id: string, patch: Partial<{ status: LeadStatus; temperature: LeadTemperature; notes: string }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_leads").update(patch).eq("id", id);
  return error ? error.message : null;
}
export async function saveLeadEdit(id: string, f: LeadEditFields): Promise<string | null> {
  const { error } = await supabase.from("marketing_leads").update({ customer_name: f.customerName, customer_email: f.customerEmail, customer_phone: f.customerPhone || null, company: f.company || null, whatsapp_phone: f.whatsappPhone || null }).eq("id", id);
  return error ? error.message : null;
}
export async function deleteLead(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_leads").delete().eq("id", id);
  return error ? error.message : null;
}
export async function emailLead(id: string, subject: string, body: string): Promise<{ ok: boolean; message?: string }> {
  const { data, error } = await supabase.rpc("_marketing_email_lead", { _lead_id: id, _subject: subject, _body: body });
  if (error) return { ok: false, message: error.message };
  const r = data as { status: string; message?: string };
  return r.status === "ok" ? { ok: true } : { ok: false, message: r.message };
}
export async function getLeadCounts(): Promise<{ total: number; new: number; hot: number }> {
  const head = () => supabase.from("marketing_leads").select("id", { count: "exact", head: true });
  const [total, nw, hot] = await Promise.all([head(), head().eq("status", "new"), head().eq("temperature", "hot")]);
  return { total: total.count ?? 0, new: nw.count ?? 0, hot: hot.count ?? 0 };
}
