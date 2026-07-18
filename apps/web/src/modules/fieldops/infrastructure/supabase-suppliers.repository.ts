import { supabase } from "@shared/lib/supabase";
import type { Supplier, SupplierFormData, SupplierListResult, ISupplierRepository } from "@fieldops/domain/supplier.types";
import type { Result } from "@fieldops/domain/inventory.types";

const SELECT = "id, name, description, company_type, primary_category, secondary_categories, website, catalog_url, contact_name, phone, email, whatsapp, address, city, state, zip_code, country, facebook, instagram, linkedin, tax_id, tax_exempt, tax_rate, currency, accepted_payments, bank_name, bank_account, routing_number, payment_terms, credit_limit, credit_balance, lead_time_days, delivery_method, min_order_amount, return_policy, rating, notes, is_active";
type Row = Record<string, unknown>;
const s = (v: unknown) => (v as string | null) ?? "";
const n = (v: unknown) => (v == null ? null : Number(v));
const a = (v: unknown) => (v as string[] | null) ?? [];
const toSupplier = (r: Row): Supplier => ({
  id: r.id as string, name: s(r.name), description: s(r.description), companyType: s(r.company_type),
  primaryCategory: s(r.primary_category), secondaryCategories: a(r.secondary_categories), website: s(r.website), catalogUrl: s(r.catalog_url),
  contactName: s(r.contact_name), phone: s(r.phone), email: s(r.email), whatsapp: s(r.whatsapp),
  address: s(r.address), city: s(r.city), state: s(r.state), zipCode: s(r.zip_code), country: s(r.country),
  facebook: s(r.facebook), instagram: s(r.instagram), linkedin: s(r.linkedin),
  taxId: s(r.tax_id), taxExempt: !!r.tax_exempt, taxRate: n(r.tax_rate), currency: s(r.currency) || "USD",
  acceptedPayments: a(r.accepted_payments), bankName: s(r.bank_name), bankAccount: s(r.bank_account), routingNumber: s(r.routing_number),
  paymentTerms: s(r.payment_terms), creditLimit: n(r.credit_limit), creditBalance: n(r.credit_balance),
  leadTimeDays: n(r.lead_time_days), deliveryMethod: s(r.delivery_method), minOrderAmount: n(r.min_order_amount), returnPolicy: s(r.return_policy),
  rating: n(r.rating), notes: s(r.notes), active: !!r.is_active,
});
const toRow = (d: SupplierFormData) => ({
  name: d.name, description: d.description || null, company_type: d.companyType || null, primary_category: d.primaryCategory || null,
  secondary_categories: d.secondaryCategories.length ? [...d.secondaryCategories] : null, website: d.website || null, catalog_url: d.catalogUrl || null,
  contact_name: d.contactName || null, phone: d.phone || null, email: d.email || null, whatsapp: d.whatsapp || null,
  address: d.address || null, city: d.city || null, state: d.state || null, zip_code: d.zipCode || null, country: d.country || null,
  facebook: d.facebook || null, instagram: d.instagram || null, linkedin: d.linkedin || null,
  tax_id: d.taxId || null, tax_exempt: d.taxExempt, tax_rate: d.taxRate, currency: d.currency || null,
  accepted_payments: d.acceptedPayments.length ? [...d.acceptedPayments] : null, bank_name: d.bankName || null, bank_account: d.bankAccount || null, routing_number: d.routingNumber || null,
  payment_terms: d.paymentTerms || null, credit_limit: d.creditLimit, credit_balance: d.creditBalance,
  lead_time_days: d.leadTimeDays, delivery_method: d.deliveryMethod || null, min_order_amount: d.minOrderAmount, return_policy: d.returnPolicy || null,
  rating: d.rating, notes: d.notes || null, is_active: d.active,
});

export const supabaseSupplierRepository: ISupplierRepository = {
  async list(): Promise<SupplierListResult> {
    const { data, error } = await supabase.from("inventory_suppliers").select(SELECT).order("name");
    return error ? { ok: false, error: error.message } : { ok: true, value: (data as Row[]).map(toSupplier) };
  },
  async create(d): Promise<Result<Supplier, string>> {
    const { data, error } = await supabase.from("inventory_suppliers").insert(toRow(d)).select(SELECT).single();
    return error || !data ? { ok: false, error: error?.message ?? "error" } : { ok: true, value: toSupplier(data as Row) };
  },
  async update(id, d): Promise<Result<Supplier, string>> {
    const { data, error } = await supabase.from("inventory_suppliers").update(toRow(d)).eq("id", id).select(SELECT).single();
    return error || !data ? { ok: false, error: error?.message ?? "error" } : { ok: true, value: toSupplier(data as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("inventory_suppliers").delete().eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
};
