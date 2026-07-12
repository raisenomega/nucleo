import { supabase } from "@shared/lib/supabase";
import type { ILeadsLiteRepository, LeadLite } from "@agenda/domain/leads-lite.types";

export const supabaseLeadsLiteRepository: ILeadsLiteRepository = {
  async search(term) {
    const { data } = await supabase.from("leads").select("id,contact_name").ilike("contact_name", `%${term}%`).limit(8);
    return ((data ?? []) as { id: string; contact_name: string }[]).map((r) => ({ id: r.id, name: r.contact_name }));
  },
  async create(tenantId, userId, name, phone, email) {
    const { data } = await supabase.from("leads")
      .insert({ tenant_id: tenantId, contact_name: name, phone, email: email || null, temperature: "warm", lead_source: "agenda", created_by: userId })
      .select("id").single();
    return data ? { id: (data as { id: string }).id, name } : null;
  },
};
