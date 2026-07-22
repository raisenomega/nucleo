// BC billing — facturas. Puro. items = snapshot inmutable, tax por-item.
export type BillingResult = { ok: true } | { ok: false; error: string };
export type InvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled";

export interface InvoiceItem {
  readonly description: string; readonly quantity: number; readonly unitPrice: number;
  readonly taxPct: number; readonly discountPct: number; readonly lineTotal: number;
  readonly productId?: string | null; readonly sku?: string | null;  // línea vinculada a un producto del catálogo (opcional)
}
export interface Invoice {
  readonly id: string; readonly invoiceNumber: string | null; readonly customerId: string | null; readonly clientName: string;
  readonly phone: string | null; readonly email: string | null; readonly items: InvoiceItem[];
  readonly subtotal: number; readonly tax: number; readonly total: number; readonly status: InvoiceStatus;
  readonly amountPaid: number; readonly balance: number;
  readonly dueDate: string | null; readonly paidAt: string | null;
  readonly linkedLeadId: string | null; readonly linkedOrderId: string | null; readonly createdAt: string;
}
export interface InvoiceInput {
  customerId: string | null; clientName: string; phone: string; email: string; items: InvoiceItem[];
  subtotal: number; tax: number; total: number; dueDate: string | null; status: InvoiceStatus;
}
export interface BillingSummary {
  invoices_pending: number; invoices_overdue: number; orders_pending: number; mrr: number;
}
export interface IInvoiceRepository {
  list(): Promise<Invoice[]>;
  save(input: InvoiceInput): Promise<BillingResult>;
  confirmPayment(id: string): Promise<BillingResult>;
  setStatus(id: string, status: InvoiceStatus): Promise<BillingResult>;
  fromLead(leadId: string): Promise<string | null>;
  summary(): Promise<BillingSummary>;
}
