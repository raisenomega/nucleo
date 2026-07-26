import { supabase } from "@shared/lib/supabase";

// Detalle por cliente: sus órdenes/facturas/servicios/tickets/evaluaciones (tablas existentes, staff RLS).
type Row = Record<string, unknown>;
const s = (v: unknown) => (v as string | null) ?? "";
const n = (v: unknown) => Number(v ?? 0);
const digitsOf = (p: string) => p.replace(/\D/g, "");

export interface DossierInvoice { id: string; invoiceNumber: string; total: number; status: string; dueDate: string | null }
export interface DossierService { serviceType: string; status: string; completedAt: string | null }
export interface DossierTicket { subject: string; status: string; createdAt: string }
export interface DossierReview { id: string; rating: number; comment: string; reply: string; createdAt: string }
export interface DossierLead { contactName: string; serviceRequested: string; status: string; quotedPrice: number }
export interface DossierQuote { id: string; quoteNumber: string; total: number; status: string; createdAt: string; linkedInvoiceId: string | null }
export interface Dossier { invoices: DossierInvoice[]; quotes: DossierQuote[]; services: DossierService[]; tickets: DossierTicket[]; reviews: DossierReview[]; leads: DossierLead[] }

export async function loadDossier(tenantId: string, email: string, phone: string, userId: string, profileId: string): Promise<Dossier> {
  const dg = digitsOf(phone);
  const [i, q, rs, rv, ld] = await Promise.all([
    supabase.from("invoices").select("id, invoice_number, total, status, due_date").eq("tenant_id", tenantId).or(email ? `customer_id.eq.${profileId},email.eq.${email}` : `customer_id.eq.${profileId}`).order("created_at", { ascending: false }),
    supabase.from("quotes").select("id, quote_number, total, status, created_at, linked_invoice_id").eq("tenant_id", tenantId).eq("customer_id", profileId).order("created_at", { ascending: false }),
    supabase.from("route_stops").select("service_type, status, completed_at, phone, customer_id").eq("tenant_id", tenantId).is("deleted_at", null),
    supabase.from("customer_reviews").select("id, rating, comment, reply, created_at").eq("tenant_id", tenantId).eq("customer_profile_id", profileId).order("created_at", { ascending: false }),
    supabase.from("leads").select("contact_name, service_requested, status, quoted_price").eq("tenant_id", tenantId).eq("customer_id", profileId).order("created_at", { ascending: false }),
  ]);
  const tk = userId ? await supabase.from("support_tickets").select("subject, status, created_at").eq("tenant_id", tenantId).eq("created_by", userId).order("created_at", { ascending: false }) : { data: [] as Row[] };
  const rows = (x: { data: unknown }) => (x.data as Row[] | null) ?? [];
  return {
    invoices: rows(i).map((r) => ({ id: s(r.id), invoiceNumber: s(r.invoice_number), total: n(r.total), status: s(r.status), dueDate: (r.due_date as string) ?? null })),
    quotes: rows(q).map((r) => ({ id: s(r.id), quoteNumber: s(r.quote_number), total: n(r.total), status: s(r.status), createdAt: s(r.created_at), linkedInvoiceId: (r.linked_invoice_id as string) ?? null })),
    services: rows(rs).filter((r) => r.customer_id === profileId || (!r.customer_id && dg && digitsOf(s(r.phone)) === dg)).map((r) => ({ serviceType: s(r.service_type), status: s(r.status), completedAt: (r.completed_at as string) ?? null })),
    tickets: rows(tk).map((r) => ({ subject: s(r.subject), status: s(r.status), createdAt: s(r.created_at) })),
    reviews: rows(rv).map((r) => ({ id: r.id as string, rating: n(r.rating), comment: s(r.comment), reply: s(r.reply), createdAt: s(r.created_at) })),
    leads: rows(ld).map((r) => ({ contactName: s(r.contact_name), serviceRequested: s(r.service_requested), status: s(r.status), quotedPrice: n(r.quoted_price) })),
  };
}
