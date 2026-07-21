import { supabase } from "@shared/lib/supabase";

// Vista CRM admin de clientes del portal. Lee tablas existentes (staff RLS por tenant). Sin tablas nuevas.
type Row = Record<string, unknown>;
const s = (v: unknown) => (v as string | null) ?? "";
const n = (v: unknown) => Number(v ?? 0);

export interface CustomerBase {
  id: string; userId: string; fullName: string; email: string; phone: string; address: string; city: string; state: string; zipCode: string;
  contactPreference: string; notesForTeam: string; photoUrl: string; isActive: boolean; createdAt: string;
  source: string; displayName: string; companyName: string; taxId: string; customerType: string; creditLimit: number; paymentTerms: string;
  segmentId: string; discountPct: number; onHold: boolean; holdReason: string;
}
export interface OrderLite { email: string; total: number; status: string; paidAt: string | null; createdAt: string }
export interface ReviewLite { profileId: string; rating: number }
export interface InvoiceLite { email: string; total: number; status: string }

export async function fetchCustomers(tenantId: string): Promise<CustomerBase[]> {
  const { data } = await supabase.from("customer_profiles").select("id, user_id, full_name, email, phone, address, city, state, zip_code, contact_preference, notes_for_team, photo_url, is_active, created_at, source, display_name, company_name, tax_id, customer_type, credit_limit, payment_terms, segment_id, discount_pct, on_hold, hold_reason").eq("tenant_id", tenantId).order("created_at", { ascending: false });
  return ((data as Row[] | null) ?? []).map((r) => ({ id: r.id as string, userId: s(r.user_id), fullName: s(r.full_name), email: s(r.email), phone: s(r.phone), address: s(r.address), city: s(r.city), state: s(r.state), zipCode: s(r.zip_code), contactPreference: s(r.contact_preference), notesForTeam: s(r.notes_for_team), photoUrl: s(r.photo_url), isActive: r.is_active !== false, createdAt: s(r.created_at),
    source: s(r.source) || "portal", displayName: s(r.display_name), companyName: s(r.company_name), taxId: s(r.tax_id), customerType: s(r.customer_type) || "individual", creditLimit: n(r.credit_limit), paymentTerms: s(r.payment_terms) || "immediate",
    segmentId: s(r.segment_id), discountPct: n(r.discount_pct), onHold: r.on_hold === true, holdReason: s(r.hold_reason) }));
}
export async function fetchOrders(tenantId: string): Promise<OrderLite[]> {
  const { data } = await supabase.from("tenant_landing_orders").select("customer_email, total, status, paid_at, created_at").eq("tenant_id", tenantId);
  return ((data as Row[] | null) ?? []).map((r) => ({ email: s(r.customer_email), total: n(r.total), status: s(r.status), paidAt: (r.paid_at as string) ?? null, createdAt: s(r.created_at) }));
}
export async function fetchReviews(tenantId: string): Promise<ReviewLite[]> {
  const { data } = await supabase.from("customer_reviews").select("customer_profile_id, rating").eq("tenant_id", tenantId);
  return ((data as Row[] | null) ?? []).map((r) => ({ profileId: s(r.customer_profile_id), rating: n(r.rating) }));
}
export async function fetchInvoices(tenantId: string): Promise<InvoiceLite[]> {
  const { data } = await supabase.from("invoices").select("email, total, status").eq("tenant_id", tenantId);
  return ((data as Row[] | null) ?? []).map((r) => ({ email: s(r.email), total: n(r.total), status: s(r.status) }));
}
export async function replyReview(id: string, reply: string): Promise<boolean> {
  const { error } = await supabase.from("customer_reviews").update({ reply, replied_at: new Date().toISOString() }).eq("id", id);
  return !error;
}
export async function setCustomerActive(id: string, active: boolean): Promise<boolean> {
  const { error } = await supabase.from("customer_profiles").update({ is_active: active }).eq("id", id);
  return !error;
}
export async function saveCustomerNote(id: string, note: string): Promise<boolean> {
  const { error } = await supabase.from("customer_profiles").update({ notes_for_team: note || null }).eq("id", id);
  return !error;
}

export type CustomerPayload = Record<string, string | number | null>;
export async function createCustomer(payload: CustomerPayload): Promise<string | null> {
  const { error } = await supabase.rpc("create_customer", { _payload: payload });
  return error ? error.message : null;
}
export async function updateCustomer(id: string, payload: CustomerPayload): Promise<string | null> {
  const { error } = await supabase.rpc("update_customer", { _customer_id: id, _payload: payload });
  return error ? error.message : null;
}
