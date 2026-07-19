import { supabase } from "@shared/lib/supabase";

// Detalle por cliente: sus órdenes/facturas/servicios/tickets/evaluaciones (tablas existentes, staff RLS).
type Row = Record<string, unknown>;
const s = (v: unknown) => (v as string | null) ?? "";
const n = (v: unknown) => Number(v ?? 0);
const digitsOf = (p: string) => p.replace(/\D/g, "");

export interface DossierOrder { orderNumber: string; total: number; status: string; createdAt: string }
export interface DossierInvoice { invoiceNumber: string; total: number; status: string; dueDate: string | null }
export interface DossierService { serviceType: string; status: string; completedAt: string | null }
export interface DossierTicket { subject: string; status: string; createdAt: string }
export interface DossierReview { id: string; rating: number; comment: string; reply: string; createdAt: string }
export interface Dossier { orders: DossierOrder[]; invoices: DossierInvoice[]; services: DossierService[]; tickets: DossierTicket[]; reviews: DossierReview[] }

export async function loadDossier(tenantId: string, email: string, phone: string, userId: string, profileId: string): Promise<Dossier> {
  const dg = digitsOf(phone);
  const [o, i, rs, rv] = await Promise.all([
    supabase.from("tenant_landing_orders").select("order_number, total, status, created_at").eq("tenant_id", tenantId).eq("customer_email", email).order("created_at", { ascending: false }).limit(10),
    supabase.from("invoices").select("invoice_number, total, status, due_date").eq("tenant_id", tenantId).eq("email", email).order("created_at", { ascending: false }),
    supabase.from("route_stops").select("service_type, status, completed_at, phone").eq("tenant_id", tenantId).is("deleted_at", null),
    supabase.from("customer_reviews").select("id, rating, comment, reply, created_at").eq("tenant_id", tenantId).eq("customer_profile_id", profileId).order("created_at", { ascending: false }),
  ]);
  const tk = userId ? await supabase.from("support_tickets").select("subject, status, created_at").eq("tenant_id", tenantId).eq("created_by", userId).order("created_at", { ascending: false }) : { data: [] as Row[] };
  const rows = (x: { data: unknown }) => (x.data as Row[] | null) ?? [];
  return {
    orders: rows(o).map((r) => ({ orderNumber: s(r.order_number), total: n(r.total), status: s(r.status), createdAt: s(r.created_at) })),
    invoices: rows(i).map((r) => ({ invoiceNumber: s(r.invoice_number), total: n(r.total), status: s(r.status), dueDate: (r.due_date as string) ?? null })),
    services: rows(rs).filter((r) => dg && digitsOf(s(r.phone)) === dg).map((r) => ({ serviceType: s(r.service_type), status: s(r.status), completedAt: (r.completed_at as string) ?? null })),
    tickets: rows(tk).map((r) => ({ subject: s(r.subject), status: s(r.status), createdAt: s(r.created_at) })),
    reviews: rows(rv).map((r) => ({ id: r.id as string, rating: n(r.rating), comment: s(r.comment), reply: s(r.reply), createdAt: s(r.created_at) })),
  };
}
