import type { Order, OrderItem, OrderStatus } from "@orders/domain/order.types";
import type { OrderHistoryEvent } from "@orders/domain/order-status-history.types";

export interface OrderRow {
  id: string; order_number: string | null; customer_id: string | null; customer_name: string | null; customer_email: string | null;
  customer_phone: string | null; items: unknown; custom_fields: unknown; form_id: string | null; subtotal: number; tax: number; shipping: number; discount: number;
  total: number; currency: string | null; status: OrderStatus; source_hostname: string | null;
  utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
  linked_lead_id: string | null; linked_invoice_id: string | null; created_at: string; paid_at: string | null;
  payment_method_key: string | null; client_confirmed_at: string | null;
}
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const toItems = (v: unknown): OrderItem[] => (Array.isArray(v) ? v.map((i) => ({
  kind: typeof i?.kind === "string" ? i.kind : undefined, name: String(i?.name ?? ""), qty: num(i?.qty), price: num(i?.price),
})) : []);

export const toOrder = (r: OrderRow): Order => ({
  id: r.id, orderNumber: r.order_number, customerId: r.customer_id, customerName: r.customer_name ?? "", customerEmail: r.customer_email ?? "",
  customerPhone: r.customer_phone ?? "", items: toItems(r.items),
  customFields: (r.custom_fields && typeof r.custom_fields === "object" ? r.custom_fields : {}) as Record<string, unknown>, formId: r.form_id,
  subtotal: num(r.subtotal), tax: num(r.tax),
  shipping: num(r.shipping), discount: num(r.discount), total: num(r.total), currency: r.currency ?? "USD",
  status: r.status, sourceHostname: r.source_hostname, utmSource: r.utm_source, utmMedium: r.utm_medium,
  utmCampaign: r.utm_campaign, linkedLeadId: r.linked_lead_id, linkedInvoiceId: r.linked_invoice_id,
  createdAt: r.created_at, paidAt: r.paid_at, paymentMethodKey: r.payment_method_key, clientConfirmedAt: r.client_confirmed_at,
});

export interface HistoryRow {
  id: string; from_status: OrderStatus | null; to_status: OrderStatus; note: string | null;
  created_at: string; changed_by: string | null;
}
export const toHistoryEvent = (r: HistoryRow, changedByName: string | null): OrderHistoryEvent => ({
  id: r.id, fromStatus: r.from_status, toStatus: r.to_status, note: r.note, createdAt: r.created_at, changedByName,
});
