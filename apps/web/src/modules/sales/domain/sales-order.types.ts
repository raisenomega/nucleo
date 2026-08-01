// BC sales — órdenes de venta (fulfillment). Puro. Hermano de quotes; alimenta conduces + facturas.
export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// Result y no `string | null`: estas RPC NUNCA devuelven null (o retornan uuid o hacen raise), asi que un
// null solo podia significar «fallo tragado» — indistinguible de un resultado real (auditoria E2E §13).
export type SoResult = { ok: true; id?: string } | { ok: false; error: string };
export type SoStatus = "draft" | "confirmed" | "partially_shipped" | "shipped" | "partially_invoiced" | "invoiced" | "closed" | "cancelled";

export interface SalesOrderItem {
  readonly id: string; readonly description: string; readonly productId: string | null; readonly itemId: string | null;
  readonly qtyOrdered: number; readonly qtyShipped: number; readonly qtyInvoiced: number; readonly qtyBackordered: number;
  readonly unitPrice: number; readonly discountPct: number; readonly taxPct: number;
  readonly subtotal: number; readonly tax: number; readonly total: number; readonly warehouseId: string | null;
}
export interface SalesOrder {
  readonly id: string; readonly orderNumber: string; readonly customerId: string; readonly customerName: string;
  readonly quoteId: string | null; readonly quoteNumber: string | null; readonly orderDate: string; readonly deliveryDate: string | null;
  readonly status: SoStatus; readonly subtotal: number; readonly taxAmount: number; readonly discountAmount: number; readonly total: number;
  readonly shippingAddress: string | null; readonly paymentTerms: string | null; readonly notesInternal: string | null; readonly notesCustomer: string | null;
  readonly confirmedAt: string | null; readonly items: SalesOrderItem[]; readonly createdAt: string;
}
export interface SoLineInput {
  description: string; qty: number; unitPrice: number; discountPct: number; taxPct: number;
  productId?: string | null; itemId?: string | null; warehouseId?: string | null;
}
export interface SoInput {
  customerId: string; deliveryDate: string | null; shippingAddressId: string | null; paymentTerms: string | null;
  notesInternal: string; notesCustomer: string; items: SoLineInput[];
}
export interface Backorder { description: string; qty_backordered: number; }
export interface ConfirmResult { confirmed: boolean; backordered_items: Backorder[]; }

export interface ISalesOrderRepository {
  list(): Promise<SalesOrder[]>;
  create(input: SoInput): Promise<SoResult>;
  createFromQuote(quoteId: string): Promise<Result<string, string>>;
  confirm(id: string): Promise<ConfirmResult>;
  cancel(id: string, reason: string): Promise<SoResult>;
  update(id: string, input: SoInput): Promise<SoResult>;
  invoiceFromOrder(id: string): Promise<Result<string, string>>;
}
