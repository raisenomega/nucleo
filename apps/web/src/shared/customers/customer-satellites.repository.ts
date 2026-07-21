import { supabase } from "@shared/lib/supabase";

// Direcciones y contactos del cliente (tablas satélite, migr 223). Lectura por RLS de staff (tenant);
// escritura solo por RPCs SECURITY DEFINER gateadas. Payload snake_case → pasa directo a la RPC.
export interface CustomerAddress {
  id: string; customer_id: string; address_type: string; label: string | null; line1: string; line2: string | null;
  city: string | null; state: string | null; postal_code: string | null; country: string; is_default: boolean; notes: string | null;
}
export interface CustomerContact {
  id: string; customer_id: string; name: string; role: string | null; email: string | null; phone: string | null; is_primary: boolean; notes: string | null;
}
export type Payload = Record<string, string | number | boolean | null | undefined>;
const err = (e: { message: string } | null) => (e ? e.message : null);

export const satellitesRepository = {
  async listAddresses(customerId: string): Promise<CustomerAddress[]> {
    const { data } = await supabase.from("customer_addresses").select("*").eq("customer_id", customerId).order("address_type");
    return (data as CustomerAddress[] | null) ?? [];
  },
  async listContacts(customerId: string): Promise<CustomerContact[]> {
    const { data } = await supabase.from("customer_contacts").select("*").eq("customer_id", customerId).order("name");
    return (data as CustomerContact[] | null) ?? [];
  },
  async upsertAddress(p: Payload): Promise<string | null> { return err((await supabase.rpc("upsert_customer_address", { _payload: p })).error); },
  async deleteAddress(id: string): Promise<string | null> { return err((await supabase.rpc("delete_customer_address", { _id: id })).error); },
  async upsertContact(p: Payload): Promise<string | null> { return err((await supabase.rpc("upsert_customer_contact", { _payload: p })).error); },
  async deleteContact(id: string): Promise<string | null> { return err((await supabase.rpc("delete_customer_contact", { _id: id })).error); },
};
