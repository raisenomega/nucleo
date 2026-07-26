import { supabase } from "@shared/lib/supabase";

// Órdenes del cliente con detalle (correlación FK + email, rodaja 2). Sin cap. La tabla no tiene "despachó/fulfilled_by".
export interface OrderItemLite { name: string; qty: number }
export interface CustomerOrder {
  id: string; orderNumber: string; total: number; status: string; createdAt: string;
  items: OrderItemLite[]; paymentMethod: string | null; source: string | null; linkedInvoiceId: string | null;
}
type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => (v as string | null) ?? "";

export async function listCustomerOrders(tenantId: string, profileId: string, email: string): Promise<CustomerOrder[]> {
  const orf = email ? `customer_id.eq.${profileId},customer_email.eq.${email}` : `customer_id.eq.${profileId}`;
  const { data } = await supabase.from("tenant_landing_orders")
    .select("id, order_number, total, status, created_at, items, payment_method_key, source_hostname, linked_invoice_id")
    .eq("tenant_id", tenantId).or(orf).order("created_at", { ascending: false });
  return ((data as Row[] | null) ?? []).map((r) => ({
    id: r.id as string, orderNumber: s(r.order_number), total: n(r.total), status: s(r.status), createdAt: s(r.created_at),
    items: ((r.items as Row[] | null) ?? []).map((it) => ({ name: s(it.name) || "—", qty: n(it.qty) })),
    paymentMethod: (r.payment_method_key as string) || null, source: (r.source_hostname as string) || null,
    linkedInvoiceId: (r.linked_invoice_id as string) ?? null,
  }));
}
