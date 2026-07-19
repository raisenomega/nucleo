import { supabase } from "@shared/lib/supabase";

// Auth del customer (email+password + magic link). Wrappers finos sobre supabase.auth. Devuelven mensaje de error o null.
export async function signInCustomer(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}
export async function signUpCustomer(email: string, password: string): Promise<string | null> {
  const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/portal` : undefined;
  const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } });
  return error ? error.message : null;
}
export async function magicLinkCustomer(email: string): Promise<string | null> {
  const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/portal` : undefined;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
  return error ? error.message : null;
}
export async function resetPasswordCustomer(email: string): Promise<string | null> {
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/portal` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return error ? error.message : null;
}
export async function signOutCustomer(): Promise<void> { await supabase.auth.signOut(); }
