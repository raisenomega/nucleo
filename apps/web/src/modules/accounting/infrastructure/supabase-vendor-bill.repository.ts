import { supabase } from "@shared/lib/supabase";
import type { VendorBill, VendorBillLine, VendorBillPayment, BillFormData, BillStatus, IVendorBillRepository } from "@accounting/domain/vendor-bill.types";
import type { Result } from "@accounting/domain/chart-of-accounts.types";

const LIST = "id, tenant_id, supplier_id, bill_number, internal_number, bill_date, due_date, status, subtotal, tax_amount, total, amount_paid, balance, purchase_order_id, notes, approved_at, created_at, supplier:inventory_suppliers(name), po:inventory_purchase_orders(order_number)";
const DETAIL = LIST + ", lines:vendor_bill_lines(id, description, quantity, unit_price, tax_pct, subtotal, tax, total, item_id, po_line_id, category_id, account_id, item:inventory_items(name)), payments:vendor_bill_payments(id, amount, payment_date, reference, notes, voided_at, created_at, pm:categories(label))";
type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v ?? 0);
const overdue = (due: string, bal: number) => { if (bal <= 0) return 0; const d = Math.floor((Date.now() - new Date(due).getTime()) / 86400000); return d > 0 ? d : 0; };

function toLine(r: Row): VendorBillLine {
  const it = r.item as { name?: string } | null;
  return { id: r.id as string, description: r.description as string, quantity: n(r.quantity), unitPrice: n(r.unit_price), taxPct: n(r.tax_pct),
    subtotal: n(r.subtotal), tax: n(r.tax), total: n(r.total), itemId: (r.item_id as string) ?? null, itemName: it?.name ?? null,
    poLineId: (r.po_line_id as string) ?? null, categoryId: (r.category_id as string) ?? null, accountId: (r.account_id as string) ?? null };
}
function toPayment(r: Row): VendorBillPayment {
  const pm = r.pm as { label?: string } | null;
  return { id: r.id as string, amount: n(r.amount), paymentDate: r.payment_date as string, paymentMethodName: pm?.label ?? null,
    reference: (r.reference as string) ?? null, notes: (r.notes as string) ?? null, voidedAt: (r.voided_at as string) ?? null, createdAt: r.created_at as string };
}
function toBill(r: Row): VendorBill {
  const s = r.supplier as { name?: string } | null; const po = r.po as { order_number?: number } | null; const bal = n(r.balance);
  return { id: r.id as string, tenantId: r.tenant_id as string, supplierId: r.supplier_id as string, supplierName: s?.name ?? "—",
    billNumber: r.bill_number as string, internalNumber: r.internal_number as string, billDate: r.bill_date as string, dueDate: r.due_date as string,
    status: r.status as BillStatus, subtotal: n(r.subtotal), taxAmount: n(r.tax_amount), total: n(r.total), amountPaid: n(r.amount_paid), balance: bal,
    purchaseOrderId: (r.purchase_order_id as string) ?? null, poNumber: po?.order_number != null ? `PO-${po.order_number}` : null,
    notes: (r.notes as string) ?? null, approvedAt: (r.approved_at as string) ?? null, approvedByName: null,
    lines: ((r.lines as Row[]) ?? []).map(toLine), payments: ((r.payments as Row[]) ?? []).map(toPayment), createdAt: r.created_at as string, daysOverdue: overdue(r.due_date as string, bal) };
}
const ok = <T>(value: T): Result<T, string> => ({ ok: true, value });
const fail = (e: { message?: string } | null): Result<never, string> => ({ ok: false, error: e?.message ?? "Error" });

export const vendorBillRepository: IVendorBillRepository = {
  async list() { const { data } = await supabase.from("vendor_bills").select(LIST).is("deleted_at", null).order("created_at", { ascending: false }); return ((data as Row[]) ?? []).map(toBill); },
  async getById(id) { const { data } = await supabase.from("vendor_bills").select(DETAIL).eq("id", id).is("deleted_at", null).maybeSingle(); return data ? toBill(data as unknown as Row) : null; },
  async create(d: BillFormData) { const { data, error } = await supabase.rpc("create_vendor_bill", { p_supplier_id: d.supplierId, p_bill_number: d.billNumber, p_bill_date: d.billDate, p_due_date: d.dueDate, p_purchase_order_id: d.purchaseOrderId, p_notes: d.notes, p_lines: d.lines.map((l) => ({ description: l.description, quantity: l.quantity, unit_price: l.unitPrice, tax_pct: l.taxPct, item_id: l.itemId ?? null, category_id: l.categoryId ?? null })) }); return error ? fail(error) : ok(data as string); },
  async createFromPo(poId, billNumber, billDate, dueDate) { const { data, error } = await supabase.rpc("create_vendor_bill_from_po", { p_purchase_order_id: poId, p_bill_number: billNumber, p_bill_date: billDate, p_due_date: dueDate }); return error ? fail(error) : ok(data as string); },
  async approve(id) { const { error } = await supabase.rpc("approve_vendor_bill", { p_bill_id: id }); return error ? fail(error) : ok(null); },
  async recordPayment(billId, amount, date, methodId, reference, notes) { const { error } = await supabase.rpc("record_vendor_bill_payment", { p_bill_id: billId, p_amount: amount, p_payment_date: date, p_payment_method_id: methodId, p_reference: reference, p_notes: notes }); return error ? fail(error) : ok(null); },
  async voidPayment(paymentId, reason) { const { error } = await supabase.rpc("void_vendor_bill_payment", { p_payment_id: paymentId, p_reason: reason }); return error ? fail(error) : ok(null); },
  async voidBill(id) { const { error } = await supabase.rpc("void_vendor_bill", { p_bill_id: id, p_reason: "Anulada" }); return error ? fail(error) : ok(null); },
};
