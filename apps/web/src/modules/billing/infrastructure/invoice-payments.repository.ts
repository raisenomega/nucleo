import { supabase } from "@shared/lib/supabase";

// Pagos parciales de una factura (migr 228). Lectura por RLS staff; escritura por RPCs DEFINER (record/void).
export interface InvoicePayment {
  id: string; amount: number; paymentDate: string; reference: string | null; notes: string | null; createdAt: string;
}
export interface RecordPayment {
  invoice_id: string; amount: number; payment_method_id?: string | null; payment_date?: string; reference?: string; notes?: string;
}
type Row = Record<string, unknown>;
const err = (e: { message: string } | null) => (e ? e.message : null);

export async function listPayments(invoiceId: string): Promise<InvoicePayment[]> {
  const { data } = await supabase.from("invoice_payments").select("id, amount, payment_date, reference, notes, created_at").eq("invoice_id", invoiceId).order("payment_date", { ascending: false });
  return ((data as Row[] | null) ?? []).map((r) => ({
    id: r.id as string, amount: Number(r.amount ?? 0), paymentDate: (r.payment_date as string) ?? "",
    reference: (r.reference as string | null) ?? null, notes: (r.notes as string | null) ?? null, createdAt: (r.created_at as string) ?? "",
  }));
}
export const recordPayment = async (p: RecordPayment): Promise<string | null> => err((await supabase.rpc("record_invoice_payment", { _payload: p })).error);
export const voidPayment = async (id: string, reason: string): Promise<string | null> => err((await supabase.rpc("void_invoice_payment", { _payment_id: id, _reason: reason })).error);
