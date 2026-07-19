import { supabase } from "@shared/lib/supabase";

// Config del cliente: contraseña (auth), preferencias (customer_profiles), soft-delete y export GDPR.
export async function updatePassword(pw: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password: pw });
  return error ? error.message : null;
}
export async function updateCustomerPrefs(id: string, patch: Record<string, string>): Promise<boolean> {
  const { error } = await supabase.from("customer_profiles").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  return !error;
}
export async function deactivateAccount(id: string): Promise<boolean> {
  const { error } = await supabase.from("customer_profiles").update({ is_active: false }).eq("id", id);
  return !error;
}
// Descargar mis datos (GDPR): todo lo que el cliente puede ver por RLS.
export async function exportMyData(tenantId: string): Promise<Record<string, unknown>> {
  const tbl = (name: string) => supabase.from(name).select("*").eq("tenant_id", tenantId);
  const [o, i, r, k] = await Promise.all([tbl("tenant_landing_orders"), tbl("invoices"), tbl("customer_reviews"), tbl("support_tickets")]);
  return { orders: o.data ?? [], invoices: i.data ?? [], reviews: r.data ?? [], tickets: k.data ?? [] };
}
