import { supabase } from "@shared/lib/supabase";

// Auth del customer (email+password + magic link). Wrappers finos sobre supabase.auth. Devuelven mensaje de error o null.
// signup_source en metadata: handle_new_user lo usa para NO crear tenant trial/profile/rol (BUG A, migr 196).
export interface PortalSignupMeta { tenantId: string | null; name?: string; phone?: string }
function portalMeta(m?: PortalSignupMeta): Record<string, string> {
  const d: Record<string, string> = { signup_source: "customer_portal" };
  if (m?.tenantId) d.portal_tenant_id = m.tenantId;
  if (m?.name) d.full_name = m.name;
  if (m?.phone) d.phone = m.phone;
  return d;
}
export async function signInCustomer(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}
export async function signUpCustomer(email: string, password: string, meta?: PortalSignupMeta): Promise<string | null> {
  const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/portal` : undefined;
  const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo, data: portalMeta(meta) } });
  return error ? error.message : null;
}
export async function magicLinkCustomer(email: string, meta?: PortalSignupMeta): Promise<string | null> {
  const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/portal` : undefined;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo, data: portalMeta(meta) } });
  return error ? error.message : null;
}
export async function resetPasswordCustomer(email: string): Promise<string | null> {
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/portal` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return error ? error.message : null;
}
export async function signOutCustomer(): Promise<void> { await supabase.auth.signOut(); }
