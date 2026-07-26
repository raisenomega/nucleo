import { supabase } from "@shared/lib/supabase";

// Config del cliente: contraseña (auth), preferencias (customer_profiles), soft-delete y export GDPR.
export async function updatePassword(pw: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password: pw });
  return error ? error.message : null;
}
// Actualiza vía RPC whitelist (solo campos editables por el cliente; nunca notes_for_team ni campos internos).
export async function updateCustomerPrefs(_id: string, patch: Record<string, string>): Promise<boolean> {
  const { error } = await supabase.rpc("update_my_customer", { _payload: patch });
  return !error;
}
export async function deactivateAccount(_id: string): Promise<boolean> {
  const { error } = await supabase.rpc("deactivate_my_account", {});
  return !error;
}
// Descargar mis datos (GDPR): todo lo que el cliente puede ver por RLS.
export async function exportMyData(tenantId: string): Promise<Record<string, unknown>> {
  const tbl = (name: string) => supabase.from(name).select("*").eq("tenant_id", tenantId);
  const [o, i, r, k] = await Promise.all([tbl("tenant_landing_orders"), tbl("invoices"), tbl("customer_reviews"), tbl("support_tickets")]);
  return { orders: o.data ?? [], invoices: i.data ?? [], reviews: r.data ?? [], tickets: k.data ?? [] };
}
