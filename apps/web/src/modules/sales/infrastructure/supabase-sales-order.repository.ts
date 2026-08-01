import { supabase } from "@shared/lib/supabase";
import type { ISalesOrderRepository, SalesOrder, SalesOrderItem, SoStatus, SoResult, SoInput, ConfirmResult } from "@sales/domain/sales-order.types";

interface IRow { id: string; description: string; product_id: string | null; item_id: string | null; qty_ordered: number; qty_shipped: number; qty_invoiced: number; qty_backordered: number; unit_price: number; discount_pct: number; tax_pct: number; subtotal: number; tax: number; total: number; warehouse_id: string | null; }
interface Row {
  id: string; order_number: string; customer_id: string; quote_id: string | null; order_date: string; delivery_date: string | null;
  status: string; subtotal: number; tax_amount: number; discount_amount: number; total: number; shipping_address: string | null;
  payment_terms: string | null; notes_internal: string | null; notes_customer: string | null; confirmed_at: string | null; created_at: string;
  customer: { full_name: string | null } | null; quote: { quote_number: string | null } | null; items: IRow[] | null;
}
const SEL = "id,order_number,customer_id,quote_id,order_date,delivery_date,status,subtotal,tax_amount,discount_amount,total,shipping_address,payment_terms,notes_internal,notes_customer,confirmed_at,created_at,customer:customer_profiles(full_name),quote:quotes(quote_number),items:sales_order_items(id,description,product_id,item_id,qty_ordered,qty_shipped,qty_invoiced,qty_backordered,unit_price,discount_pct,tax_pct,subtotal,tax,total,warehouse_id)";
const ok = (e: { message: string } | null, id?: string): SoResult => (e ? { ok: false, error: e.message } : { ok: true, id });
const toItem = (r: IRow): SalesOrderItem => ({ id: r.id, description: r.description, productId: r.product_id, itemId: r.item_id, qtyOrdered: r.qty_ordered, qtyShipped: r.qty_shipped, qtyInvoiced: r.qty_invoiced, qtyBackordered: r.qty_backordered, unitPrice: r.unit_price, discountPct: r.discount_pct, taxPct: r.tax_pct, subtotal: r.subtotal, tax: r.tax, total: r.total, warehouseId: r.warehouse_id });
const toSo = (r: Row): SalesOrder => ({ id: r.id, orderNumber: r.order_number, customerId: r.customer_id, customerName: r.customer?.full_name ?? "—", quoteId: r.quote_id, quoteNumber: r.quote?.quote_number ?? null, orderDate: r.order_date, deliveryDate: r.delivery_date, status: r.status as SoStatus, subtotal: r.subtotal, taxAmount: r.tax_amount, discountAmount: r.discount_amount, total: r.total, shippingAddress: r.shipping_address, paymentTerms: r.payment_terms, notesInternal: r.notes_internal, notesCustomer: r.notes_customer, confirmedAt: r.confirmed_at, items: (r.items ?? []).map(toItem), createdAt: r.created_at });
const jsonItems = (d: SoInput) => d.items.map((i) => ({ description: i.description, qty: i.qty, unit_price: i.unitPrice, discount_pct: i.discountPct, tax_pct: i.taxPct, item_id: i.itemId ?? null, product_id: i.productId ?? null, warehouse_id: i.warehouseId ?? null }));

export const supabaseSalesOrderRepository: ISalesOrderRepository = {
  async list(): Promise<SalesOrder[]> {
    const { data } = await supabase.from("sales_orders").select(SEL).order("created_at", { ascending: false });
    return ((data as Row[] | null) ?? []).map(toSo);
  },
  async create(d): Promise<SoResult> {
    const { data, error } = await supabase.rpc("create_sales_order", { p_customer_id: d.customerId, p_items: jsonItems(d),
      p_delivery_date: d.deliveryDate, p_shipping_address_id: d.shippingAddressId, p_payment_terms: d.paymentTerms,
      p_notes_internal: d.notesInternal || null, p_notes_customer: d.notesCustomer || null });
    return ok(error, (data as string | null) ?? undefined);
  },
  async createFromQuote(quoteId) {
    const { data, error } = await supabase.rpc("create_sales_order_from_quote", { p_quote_id: quoteId });
    if (error || !data) return { ok: false as const, error: error?.message ?? "Sin datos del servidor" };
    return { ok: true as const, value: data as string };
  },
  async confirm(id) {
    const { data, error } = await supabase.rpc("confirm_sales_order", { p_order_id: id });
    if (error || !data) return { ok: false as const, error: error?.message ?? "Sin datos del servidor" };
    return { ok: true as const, value: data as ConfirmResult };
  },
  async cancel(id, reason): Promise<SoResult> {
    return ok((await supabase.rpc("cancel_sales_order", { p_order_id: id, p_reason: reason || null })).error);
  },
  async update(id, d): Promise<SoResult> {
    return ok((await supabase.rpc("update_sales_order", { p_order_id: id, p_data: { delivery_date: d.deliveryDate, payment_terms: d.paymentTerms, notes_internal: d.notesInternal, notes_customer: d.notesCustomer, items: jsonItems(d) } })).error);
  },
  async invoiceFromOrder(id) {
    const { data, error } = await supabase.rpc("create_invoice_from_sales_order", { p_order_id: id });
    if (error || !data) return { ok: false as const, error: error?.message ?? "Sin datos del servidor" };
    return { ok: true as const, value: data as string };
  },
};
