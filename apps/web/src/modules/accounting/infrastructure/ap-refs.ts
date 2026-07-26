import { supabase } from "@shared/lib/supabase";

// Datos de referencia para los formularios de AP (proveedores, POs recibibles, métodos de pago, categorías de gasto).
export type SupplierRef = { id: string; name: string; paymentTerms: string | null };
export type PoRef = { id: string; orderNumber: number; supplierId: string; supplierName: string; total: number };
export type OptionRef = { id: string; label: string };

export async function fetchSuppliers(): Promise<SupplierRef[]> {
  const { data } = await supabase.from("inventory_suppliers").select("id, name, payment_terms").order("name");
  return ((data as { id: string; name: string; payment_terms: string | null }[]) ?? []).map((s) => ({ id: s.id, name: s.name, paymentTerms: s.payment_terms }));
}
export async function fetchReceivablePos(): Promise<PoRef[]> {
  const { data } = await supabase.from("inventory_purchase_orders").select("id, order_number, supplier_id, total_cost, status, supplier:inventory_suppliers(name)").in("status", ["received", "partial"]).order("order_number", { ascending: false });
  return ((data as Record<string, unknown>[]) ?? []).map((p) => ({ id: p.id as string, orderNumber: Number(p.order_number), supplierId: p.supplier_id as string, supplierName: (p.supplier as { name?: string } | null)?.name ?? "—", total: Number(p.total_cost ?? 0) }));
}
export async function fetchPaymentMethods(): Promise<OptionRef[]> {
  const { data } = await supabase.from("categories").select("id, label").eq("kind", "payment_method").eq("active", true).order("label");
  return ((data as OptionRef[]) ?? []);
}
export async function fetchExpenseCategories(): Promise<OptionRef[]> {
  const { data } = await supabase.from("categories").select("id, label").eq("kind", "expense").eq("active", true).order("label");
  return ((data as OptionRef[]) ?? []);
}
