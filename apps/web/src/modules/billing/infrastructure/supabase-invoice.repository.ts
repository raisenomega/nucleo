import { supabase } from "@shared/lib/supabase";
import type { IInvoiceRepository, Invoice, InvoiceItem, InvoiceStatus, BillingResult, BillingSummary } from "@billing/domain/invoice.types";

interface IRow { description: string; quantity: number; unit_price: number; tax_pct: number; discount_pct: number; line_total: number; }
interface Row {
  id: string; invoice_number: string | null; customer_id: string | null; client_name: string; phone: string | null; email: string | null;
  items: IRow[] | null; subtotal: number; tax: number; total: number; status: string;
  due_date: string | null; paid_at: string | null; linked_lead_id: string | null; linked_order_id: string | null; created_at: string;
}
const SEL = "id,invoice_number,customer_id,client_name,phone,email,items,subtotal,tax,total,status,due_date,paid_at,linked_lead_id,linked_order_id,created_at";
const EMPTY: BillingSummary = { invoices_pending: 0, invoices_overdue: 0, orders_pending: 0, mrr: 0 };
const ok = (e: { message: string } | null): BillingResult => (e ? { ok: false, error: e.message } : { ok: true });
const toItem = (r: IRow): InvoiceItem => ({ description: r.description, quantity: r.quantity, unitPrice: r.unit_price, taxPct: r.tax_pct, discountPct: r.discount_pct, lineTotal: r.line_total });
const fromItem = (i: InvoiceItem) => ({ description: i.description, quantity: i.quantity, unit_price: i.unitPrice, tax_pct: i.taxPct, discount_pct: i.discountPct, line_total: i.lineTotal });
const toInv = (r: Row): Invoice => ({
  id: r.id, invoiceNumber: r.invoice_number, customerId: r.customer_id, clientName: r.client_name, phone: r.phone, email: r.email,
  items: (r.items ?? []).map(toItem), subtotal: r.subtotal, tax: r.tax, total: r.total, status: r.status as InvoiceStatus,
  dueDate: r.due_date, paidAt: r.paid_at, linkedLeadId: r.linked_lead_id, linkedOrderId: r.linked_order_id, createdAt: r.created_at,
});

export const supabaseInvoiceRepository: IInvoiceRepository = {
  async list(): Promise<Invoice[]> {
    const { data } = await supabase.from("invoices").select(SEL).order("created_at", { ascending: false });
    return ((data as Row[] | null) ?? []).map(toInv);
  },
  async save(d): Promise<BillingResult> {
    return ok((await supabase.from("invoices").insert({
      customer_id: d.customerId, client_name: d.clientName, phone: d.phone || null, email: d.email || null, items: d.items.map(fromItem),
      subtotal: d.subtotal, tax: d.tax, total: d.total, due_date: d.dueDate, status: d.status,
    })).error);
  },
  async confirmPayment(id): Promise<BillingResult> {
    return ok((await supabase.rpc("confirm_invoice_payment", { p_invoice_id: id, p_method_id: null })).error);
  },
  async setStatus(id, status: InvoiceStatus): Promise<BillingResult> {
    return ok((await supabase.from("invoices").update({ status }).eq("id", id)).error);
  },
  async fromLead(leadId): Promise<string | null> {
    const { data } = await supabase.rpc("generate_invoice_from_lead", { p_lead_id: leadId });
    return (data as string | null) ?? null;
  },
  async summary(): Promise<BillingSummary> {
    const { data } = await supabase.rpc("get_billing_summary");
    return (data as BillingSummary | null) ?? EMPTY;
  },
};
