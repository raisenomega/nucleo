import { supabase } from "@shared/lib/supabase";
import type { MarketingLead, LeadStatus } from "@raisen-marketing/data/lead-form.types";

const SEL = "id, lead_type, customer_name, customer_email, customer_phone, business_type, message, source_url, utm_source, utm_medium, utm_campaign, status, notes, created_at";
const toLead = (o: Record<string, unknown>): MarketingLead => ({ id: o.id as string, leadType: o.lead_type as "business" | "partner", customerName: o.customer_name as string, customerEmail: o.customer_email as string, customerPhone: (o.customer_phone as string) ?? null, businessType: (o.business_type as string) ?? null, message: (o.message as string) ?? null, sourceUrl: (o.source_url as string) ?? null, utmSource: (o.utm_source as string) ?? null, utmMedium: (o.utm_medium as string) ?? null, utmCampaign: (o.utm_campaign as string) ?? null, status: o.status as LeadStatus, notes: (o.notes as string) ?? null, createdAt: o.created_at as string });

export async function getLeads(filter: { status?: string; leadType?: string }): Promise<MarketingLead[]> {
  let q = supabase.from("marketing_leads").select(SEL).order("created_at", { ascending: false });
  if (filter.status) q = q.eq("status", filter.status);
  else q = q.neq("status", "archived"); // vista por defecto: oculta archivados
  if (filter.leadType) q = q.eq("lead_type", filter.leadType);
  const { data } = await q;
  return ((data ?? []) as Record<string, unknown>[]).map(toLead);
}
export async function setLeadFields(id: string, patch: Partial<{ status: LeadStatus; notes: string }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_leads").update(patch).eq("id", id);
  return error ? error.message : null;
}
export async function deleteLead(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_leads").delete().eq("id", id);
  return error ? error.message : null;
}
export async function getNewLeadsCount(): Promise<number> {
  const { count } = await supabase.from("marketing_leads").select("id", { count: "exact", head: true }).eq("status", "new");
  return count ?? 0;
}
