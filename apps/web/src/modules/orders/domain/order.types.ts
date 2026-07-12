export type Result = { ok: true } | { ok: false; error: string };

export type OrderStatus = "pending" | "awaiting_payment" | "paid" | "processing" | "shipped" | "delivered" | "canceled" | "refunded";
export const ORDER_STATUSES: OrderStatus[] = ["pending", "awaiting_payment", "paid", "processing", "shipped", "delivered", "canceled", "refunded"];
// Estados que cuentan como "activos" (default de la lista): excluye terminales.
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ["pending", "awaiting_payment", "paid", "processing", "shipped"];

export interface OrderItem { kind?: string; name: string; qty: number; price: number; }

export interface Order {
  id: string; orderNumber: string | null; customerName: string; customerEmail: string; customerPhone: string;
  items: OrderItem[]; subtotal: number; tax: number; shipping: number; discount: number; total: number;
  currency: string; status: OrderStatus; sourceHostname: string | null;
  utmSource: string | null; utmMedium: string | null; utmCampaign: string | null;
  linkedLeadId: string | null; linkedInvoiceId: string | null; createdAt: string; paidAt: string | null;
}

export interface OrderFilters { status: OrderStatus[]; from: string; to: string; q: string; }
export interface PaymentMethod { id: string; label: string; }

export interface IOrdersRepository {
  list(f: OrderFilters, offset: number, limit: number): Promise<{ items: Order[]; total: number }>;
  get(id: string): Promise<Order | null>;
  changeStatus(id: string, status: OrderStatus, note: string): Promise<Result>;
  confirm(id: string, paymentMethodId: string | null, createInvoice: boolean): Promise<Result>;
  listPaymentMethods(): Promise<PaymentMethod[]>;
  unseenCount(): Promise<number>;
}
