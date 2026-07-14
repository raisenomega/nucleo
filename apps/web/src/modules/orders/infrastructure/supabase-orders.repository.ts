import { supabase } from "@shared/lib/supabase";
import { toOrder, type OrderRow } from "@orders/infrastructure/order.mapper";
import { ACTIVE_ORDER_STATUSES, type IOrdersRepository, type OrderFilters, type OrderStatus, type Result } from "@orders/domain/order.types";

const SEL = "id,order_number,customer_name,customer_email,customer_phone,items,custom_fields,form_id,subtotal,tax,shipping,discount,total,currency,status,source_hostname,utm_source,utm_medium,utm_campaign,linked_lead_id,linked_invoice_id,created_at,paid_at,payment_method_key,client_confirmed_at";
const errMsg = (c?: string) => (c === "already_confirmed" ? "already_confirmed" : c === "forbidden" ? "forbidden" : c ?? "error");

export const supabaseOrdersRepository: IOrdersRepository = {
  async list(f: OrderFilters, offset: number, limit: number) {
    let q = supabase.from("tenant_landing_orders").select(SEL, { count: "exact" }).order("created_at", { ascending: false });
    q = q.in("status", f.status.length ? f.status : ACTIVE_ORDER_STATUSES);
    if (f.from) q = q.gte("created_at", `${f.from}T00:00:00`);
    if (f.to) q = q.lte("created_at", `${f.to}T23:59:59`);
    if (f.q.trim()) { const t = f.q.trim(); q = q.or(`order_number.ilike.%${t}%,customer_name.ilike.%${t}%,customer_email.ilike.%${t}%,customer_phone.ilike.%${t}%`); }
    const { data, count } = await q.range(offset, offset + limit - 1);
    return { items: ((data ?? []) as unknown as OrderRow[]).map(toOrder), total: count ?? 0 };
  },
  async get(id: string) {
    const { data } = await supabase.from("tenant_landing_orders").select(SEL).eq("id", id).maybeSingle();
    return data ? toOrder(data as unknown as OrderRow) : null;
  },
  async changeStatus(id: string, status: OrderStatus, note: string): Promise<Result> {
    const { data } = await supabase.rpc("change_order_status", { _order_id: id, _status: status, _note: note });
    const d = data as { status?: string; code?: string } | null;
    return d?.status === "ok" ? { ok: true } : { ok: false, error: errMsg(d?.code) };
  },
  async confirm(id: string, paymentMethodId: string | null, createInvoice: boolean, note: string): Promise<Result> {
    const { data } = await supabase.rpc("confirm_landing_order", { _order_id: id, _payment_method_id: paymentMethodId, _create_invoice: createInvoice, _note: note || null });
    const d = data as { status?: string; code?: string } | null;
    return d?.status === "ok" ? { ok: true } : { ok: false, error: errMsg(d?.code) };
  },
  async reportNotReceived(id: string, reason: string): Promise<Result> {
    const { data } = await supabase.rpc("report_payment_not_received", { _order_id: id, _reason: reason });
    const d = data as { status?: string; code?: string } | null;
    return d?.status === "ok" ? { ok: true } : { ok: false, error: errMsg(d?.code) };
  },
  async listPaymentMethods() {
    const { data } = await supabase.from("categories").select("id,label").eq("kind", "payment_method").eq("active", true).order("sort");
    return (data ?? []) as { id: string; label: string }[];
  },
  async unseenCount() {
    const { count } = await supabase.from("tenant_landing_orders").select("id", { count: "exact", head: true })
      .in("status", ["pending", "awaiting_payment"]);
    return count ?? 0;
  },
};
