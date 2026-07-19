import { supabase } from "@shared/lib/supabase";
import type { CustomerOrder, CustomerInvoice, OrderItem } from "@shared/portal/order.types";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v ?? 0);
const parseItems = (v: unknown): OrderItem[] => (Array.isArray(v) ? (v as Row[]).map((i) => ({ name: String(i.name ?? i.label ?? "—"), qty: n(i.qty ?? i.quantity ?? 1), price: n(i.price ?? i.unit_price) })) : []);
const OSEL = "id, order_number, status, total, currency, created_at, payment_method_key, items, linked_invoice_id, client_confirmed_at, paid_at";
const ISEL = "id, invoice_number, status, total, due_date, paid_at, pdf_url, linked_order_id";
const toOrder = (r: Row): CustomerOrder => ({ id: r.id as string, orderNumber: (r.order_number as string) ?? "", status: (r.status as string) ?? "", total: n(r.total), currency: (r.currency as string) || "USD", createdAt: (r.created_at as string) ?? "", paymentMethodKey: (r.payment_method_key as string) ?? "", items: parseItems(r.items), linkedInvoiceId: (r.linked_invoice_id as string) ?? null, clientConfirmedAt: (r.client_confirmed_at as string) ?? null, paidAt: (r.paid_at as string) ?? null });
const toInvoice = (r: Row): CustomerInvoice => ({ id: r.id as string, invoiceNumber: (r.invoice_number as string) ?? "", status: (r.status as string) ?? "", total: n(r.total), dueDate: (r.due_date as string) ?? null, paidAt: (r.paid_at as string) ?? null, pdfUrl: (r.pdf_url as string) ?? "", linkedOrderId: (r.linked_order_id as string) ?? null });

export async function listOrders(tenantId: string): Promise<CustomerOrder[]> {
  const { data } = await supabase.from("tenant_landing_orders").select(OSEL).eq("tenant_id", tenantId).order("created_at", { ascending: false });
  return ((data as Row[] | null) ?? []).map(toOrder);
}
export async function listInvoices(tenantId: string): Promise<CustomerInvoice[]> {
  const { data } = await supabase.from("invoices").select(ISEL).eq("tenant_id", tenantId).order("created_at", { ascending: false });
  return ((data as Row[] | null) ?? []).map(toInvoice);
}
async function act(fn: string, id: string): Promise<boolean> {
  const { data, error } = await supabase.rpc(fn, { _order_id: id });
  return !error && (data as { status?: string } | null)?.status === "ok";
}
export const confirmPayment = (id: string) => act("customer_confirm_payment", id);
export const cancelOrder = (id: string) => act("customer_cancel_order", id);
