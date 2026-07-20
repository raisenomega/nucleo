import { supabase } from "@shared/lib/supabase";
import type { PricingAddonRow, PricingAddonDraft } from "@raisen-marketing/data/pricing.types";

const SEL = "id, name_es, name_en, description_es, description_en, price, currency, billing_period, is_active, display_order";
const toRow = (o: Record<string, unknown>): PricingAddonRow => ({ id: o.id as string, nameEs: o.name_es as string, nameEn: o.name_en as string, descEs: o.description_es as string, descEn: o.description_en as string, price: Number(o.price), currency: o.currency as string, billingPeriod: o.billing_period as string, isActive: o.is_active !== false, displayOrder: o.display_order as number });

export async function getAddons(activeOnly: boolean): Promise<PricingAddonRow[]> {
  let q = supabase.from("marketing_pricing_addons").select(SEL).order("display_order");
  if (activeOnly) q = q.eq("is_active", true);
  const { data } = await q;
  return ((data ?? []) as Record<string, unknown>[]).map(toRow);
}
export async function saveAddon(a: PricingAddonDraft): Promise<string | null> {
  const p = { name_es: a.nameEs, name_en: a.nameEn, description_es: a.descEs, description_en: a.descEn, price: a.price, currency: a.currency, billing_period: a.billingPeriod, is_active: a.isActive, display_order: a.displayOrder };
  const { error } = a.id ? await supabase.from("marketing_pricing_addons").update(p).eq("id", a.id) : await supabase.from("marketing_pricing_addons").insert(p);
  return error ? error.message : null;
}
export async function deleteAddon(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_pricing_addons").delete().eq("id", id);
  return error ? error.message : null;
}
export async function setAddonFields(id: string, patch: Partial<{ is_active: boolean; display_order: number }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_pricing_addons").update(patch).eq("id", id);
  return error ? error.message : null;
}
