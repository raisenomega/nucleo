import { supabase } from "@shared/lib/supabase";

// AR real (migr 227). Aging computado al vuelo por las RPCs (pago todo-o-nada → balance = total o 0).
export interface ArInvoice { id: string; invoiceNumber: string | null; total: number; status: string; invoiceDate: string; dueDate: string | null; daysOverdue: number; balance: number; bucket: string; }
export interface CustomerAr { customerId: string; totalOutstanding: number; invoices: ArInvoice[]; }
export interface ArBuckets { current: number; b1_30: number; b31_60: number; b61_90: number; b90_plus: number; }
export interface ArByCustomer { customerId: string | null; customerName: string; outstanding: number; }
export interface ArAging { buckets: ArBuckets; totalOutstanding: number; byCustomer: ArByCustomer[]; }
type J = Record<string, unknown>;
const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => (v as string | null) ?? null;

export async function getCustomerAr(customerId: string): Promise<CustomerAr> {
  const { data } = await supabase.rpc("get_customer_ar", { _customer_id: customerId });
  const d = (data as J | null) ?? {};
  return {
    customerId, totalOutstanding: n(d.total_outstanding),
    invoices: ((d.invoices as J[] | null) ?? []).map((r) => ({
      id: r.id as string, invoiceNumber: s(r.invoice_number), total: n(r.total), status: (r.status as string) ?? "",
      invoiceDate: (r.invoice_date as string) ?? "", dueDate: s(r.due_date), daysOverdue: n(r.days_overdue),
      balance: n(r.balance), bucket: (r.bucket as string) ?? "current",
    })),
  };
}
export async function getArAging(): Promise<ArAging> {
  const { data } = await supabase.rpc("get_ar_aging");
  const d = (data as J | null) ?? {};
  const b = (d.buckets as J | null) ?? {};
  return {
    buckets: { current: n(b.current), b1_30: n(b.b1_30), b31_60: n(b.b31_60), b61_90: n(b.b61_90), b90_plus: n(b.b90_plus) },
    totalOutstanding: n(d.total_outstanding),
    byCustomer: ((d.by_customer as J[] | null) ?? []).map((r) => ({ customerId: s(r.customer_id), customerName: (r.customer_name as string) ?? "—", outstanding: n(r.outstanding) })),
  };
}
