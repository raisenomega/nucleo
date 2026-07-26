import { supabase } from "@shared/lib/supabase";

// Pagos de factura del cliente (cross-factura). Correlación FK + email (rodaja 2). invoice_payments no tiene
// voided_at: los anulados se borran (void_invoice_payment hace DELETE), así que todo lo listado está vigente.
export interface CustomerPayment {
  id: string; amount: number; paymentDate: string; reference: string | null; invoiceId: string; invoiceNumber: string; method: string | null;
}
type Row = Record<string, unknown>;

export async function listCustomerPayments(tenantId: string, profileId: string, email: string): Promise<CustomerPayment[]> {
  const orf = email ? `customer_id.eq.${profileId},email.eq.${email}` : `customer_id.eq.${profileId}`;
  const { data: invs } = await supabase.from("invoices").select("id, invoice_number").eq("tenant_id", tenantId).or(orf);
  const num = new Map(((invs as Row[] | null) ?? []).map((r) => [r.id as string, (r.invoice_number as string) ?? "—"]));
  if (num.size === 0) return [];
  const { data } = await supabase.from("invoice_payments").select("id, amount, payment_date, reference, invoice_id, pm:categories(label)")
    .in("invoice_id", [...num.keys()]).order("payment_date", { ascending: false });
  return ((data as Row[] | null) ?? []).map((r) => ({
    id: r.id as string, amount: Number(r.amount ?? 0), paymentDate: (r.payment_date as string) ?? "",
    reference: (r.reference as string | null) ?? null, invoiceId: r.invoice_id as string,
    invoiceNumber: num.get(r.invoice_id as string) ?? "—", method: (r.pm as { label?: string } | null)?.label ?? null,
  }));
}
