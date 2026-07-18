import { supabase } from "@shared/lib/supabase";
import type { Supplier, SupplierFormData, SupplierListResult, ISupplierRepository } from "@fieldops/domain/supplier.types";
import type { Result } from "@fieldops/domain/inventory.types";

const SELECT = "id, name, contact_name, phone, email, address, lead_time_days, payment_terms, notes, is_active";
interface Row {
  id: string; name: string; contact_name: string | null; phone: string | null; email: string | null;
  address: string | null; lead_time_days: number | null; payment_terms: string | null; notes: string | null; is_active: boolean;
}
const toSupplier = (r: Row): Supplier => ({
  id: r.id, name: r.name, contactName: r.contact_name ?? "", phone: r.phone ?? "", email: r.email ?? "",
  address: r.address ?? "", leadTimeDays: r.lead_time_days, paymentTerms: r.payment_terms ?? "",
  notes: r.notes ?? "", active: r.is_active,
});
const toRow = (d: SupplierFormData) => ({
  name: d.name, contact_name: d.contactName || null, phone: d.phone || null, email: d.email || null,
  address: d.address || null, lead_time_days: d.leadTimeDays, payment_terms: d.paymentTerms || null,
  notes: d.notes || null, is_active: d.active,
});

export const supabaseSupplierRepository: ISupplierRepository = {
  async list(): Promise<SupplierListResult> {
    const { data, error } = await supabase.from("inventory_suppliers").select(SELECT).order("name");
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as Row[]).map(toSupplier) };
  },
  async create(d): Promise<Result<Supplier, string>> {
    const { data, error } = await supabase.from("inventory_suppliers").insert(toRow(d)).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toSupplier(data as Row) };
  },
  async update(id, d): Promise<Result<Supplier, string>> {
    const { data, error } = await supabase.from("inventory_suppliers").update(toRow(d)).eq("id", id).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toSupplier(data as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("inventory_suppliers").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
};
