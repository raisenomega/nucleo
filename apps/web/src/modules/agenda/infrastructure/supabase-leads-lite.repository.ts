import { supabase } from "@shared/lib/supabase";
import type { ILeadsLiteRepository, LeadLite } from "@agenda/domain/leads-lite.types";

interface Row { id: string; contact_name: string; phone: string | null; email: string | null; service_requested: string | null; notes: string | null; }
const toLite = (r: Row): LeadLite => ({ id: r.id, name: r.contact_name, phone: r.phone ?? "", email: r.email ?? "", serviceRequested: r.service_requested ?? "", notes: r.notes ?? "" });
const SEL = "id,contact_name,phone,email,service_requested,notes";

export const supabaseLeadsLiteRepository: ILeadsLiteRepository = {
  async search(term) {
    const { data } = await supabase.from("leads").select(SEL).ilike("contact_name", `%${term}%`).limit(8);
    return ((data ?? []) as Row[]).map(toLite);
  },
  async create(tenantId, userId, name, phone, email) {
    const { data } = await supabase.from("leads")
      .insert({ tenant_id: tenantId, contact_name: name, phone, email: email || null, temperature: "warm", lead_source: "agenda", created_by: userId })
      .select(SEL).single();
    return data ? toLite(data as Row) : null;
  },
};
