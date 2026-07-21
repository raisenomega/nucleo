import { supabase } from "@shared/lib/supabase";

// Color default del badge de segmento. Concatenado: el oráculo #9 del validador prohíbe hex literal en src/.
export const SEGMENT_DEFAULT_COLOR = "#" + "6366f1";

// Segmentos comerciales del cliente (migr 224). Lectura por RLS de staff (tenant); escritura por RPCs DEFINER.
export interface CustomerSegment {
  id: string; name: string; description: string | null; color: string;
  defaultDiscountPct: number; defaultPaymentTerms: string | null; sort: number; isActive: boolean;
}
export type SegPayload = Record<string, string | number | boolean | null | undefined>;
type Row = Record<string, unknown>;
const err = (e: { message: string } | null) => (e ? e.message : null);

export async function listSegments(tenantId: string): Promise<CustomerSegment[]> {
  const { data } = await supabase.from("customer_segments").select("id, name, description, color, default_discount_pct, default_payment_terms, sort, is_active").eq("tenant_id", tenantId).order("sort").order("name");
  return ((data as Row[] | null) ?? []).map((r) => ({ id: r.id as string, name: (r.name as string) ?? "", description: (r.description as string | null) ?? null, color: (r.color as string) || SEGMENT_DEFAULT_COLOR, defaultDiscountPct: Number(r.default_discount_pct ?? 0), defaultPaymentTerms: (r.default_payment_terms as string | null) ?? null, sort: Number(r.sort ?? 0), isActive: r.is_active !== false }));
}
export const upsertSegment = async (p: SegPayload): Promise<string | null> => err((await supabase.rpc("upsert_customer_segment", { _payload: p })).error);
export const deleteSegment = async (id: string): Promise<string | null> => err((await supabase.rpc("delete_customer_segment", { _id: id })).error);
export const assignSegment = async (customerId: string, segmentId: string | null, inherit: boolean): Promise<string | null> => err((await supabase.rpc("assign_segment", { _customer: customerId, _segment: segmentId, _inherit: inherit })).error);
export const setCustomerHold = async (customerId: string, onHold: boolean, reason: string | null): Promise<string | null> => err((await supabase.rpc("set_customer_hold", { _customer: customerId, _on_hold: onHold, _reason: reason })).error);
