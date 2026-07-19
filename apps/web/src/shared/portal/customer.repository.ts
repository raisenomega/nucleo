import { supabase } from "@shared/lib/supabase";
import type { CustomerProfile, CustomerFormData } from "@shared/portal/customer.types";

type Row = Record<string, unknown>;
const s = (v: unknown) => (v as string | null) ?? "";
const SEL = "id, tenant_id, full_name, email, phone, address, city, state, zip_code, photo_url, contact_preference, language, notes_for_team, is_active, notification_pref";
const toCustomer = (r: Row): CustomerProfile => ({
  id: r.id as string, tenantId: r.tenant_id as string, fullName: s(r.full_name), email: s(r.email), phone: s(r.phone),
  address: s(r.address), city: s(r.city), state: s(r.state), zipCode: s(r.zip_code), photoUrl: s(r.photo_url),
  contactPreference: s(r.contact_preference) || "email", language: s(r.language) || "es", notesForTeam: s(r.notes_for_team),
  isActive: r.is_active !== false, notificationPref: s(r.notification_pref) || "both",
});

// RLS (cp_select_own) devuelve solo las filas del usuario; filtramos por tenant del host (puede ser cliente de varios).
export async function getMyCustomer(tenantId: string): Promise<CustomerProfile | null> {
  const { data } = await supabase.from("customer_profiles").select(SEL).eq("tenant_id", tenantId).limit(1).maybeSingle();
  return data ? toCustomer(data as Row) : null;
}
export async function updateMyCustomer(id: string, d: CustomerFormData): Promise<boolean> {
  const { error } = await supabase.from("customer_profiles").update({
    full_name: d.fullName || null, phone: d.phone || null, address: d.address || null, city: d.city || null,
    state: d.state || null, zip_code: d.zipCode || null, photo_url: d.photoUrl || null,
    contact_preference: d.contactPreference, language: d.language, notes_for_team: d.notesForTeam || null, updated_at: new Date().toISOString(),
  }).eq("id", id);
  return !error;
}
export async function registerCustomer(tenantId: string, fullName: string, phone: string): Promise<string | null> {
  const { error } = await supabase.rpc("register_customer", { p_tenant_id: tenantId, p_full_name: fullName, p_phone: phone });
  return error ? error.message : null;
}
