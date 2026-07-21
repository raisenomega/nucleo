import { supabase } from "@shared/lib/supabase";
import type { PricingTierRow, PricingConfig, PricingTierDraft } from "@raisen-marketing/data/pricing.types";

const CFG = "id, eyebrow_es, eyebrow_en, title_es, title_en, disclaimer_es, disclaimer_en";
const TSEL = "id, name_es, name_en, price, currency, billing_period, tagline_es, tagline_en, features_es, features_en, cta_label_es, cta_label_en, cta_href, is_recommended, is_active, display_order";
const toCfg = (r: Record<string, unknown>): PricingConfig => ({ id: r.id as string, eyebrowEs: r.eyebrow_es as string, eyebrowEn: r.eyebrow_en as string, titleEs: r.title_es as string, titleEn: r.title_en as string, disclaimerEs: (r.disclaimer_es as string) ?? "", disclaimerEn: (r.disclaimer_en as string) ?? "" });
const toRow = (r: Record<string, unknown>): PricingTierRow => ({ id: r.id as string, nameEs: r.name_es as string, nameEn: r.name_en as string, price: Number(r.price), currency: r.currency as string, billingPeriod: r.billing_period as string, taglineEs: r.tagline_es as string, taglineEn: r.tagline_en as string, featuresEs: (r.features_es as string[]) ?? [], featuresEn: (r.features_en as string[]) ?? [], ctaLabelEs: r.cta_label_es as string, ctaLabelEn: r.cta_label_en as string, ctaHref: r.cta_href as string, isRecommended: r.is_recommended === true, isActive: r.is_active !== false, displayOrder: r.display_order as number });

// Solo 1 tier recomendado a la vez: al marcar uno, los demás pasan a false.
async function clearOtherRecommended(exceptId: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_pricing_tiers").update({ is_recommended: false }).neq("id", exceptId).eq("is_recommended", true);
  return error ? error.message : null;
}

export async function getPricingConfig(): Promise<PricingConfig | null> {
  const { data } = await supabase.from("marketing_pricing_config").select(CFG).limit(1).maybeSingle();
  return data ? toCfg(data as Record<string, unknown>) : null;
}
export async function getPricingTiers(activeOnly: boolean): Promise<PricingTierRow[]> {
  let query = supabase.from("marketing_pricing_tiers").select(TSEL).order("display_order");
  if (activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return ((data ?? []) as Record<string, unknown>[]).map(toRow);
}
export async function savePricingConfig(c: PricingConfig): Promise<string | null> {
  const { error } = await supabase.from("marketing_pricing_config").update({ eyebrow_es: c.eyebrowEs, eyebrow_en: c.eyebrowEn, title_es: c.titleEs, title_en: c.titleEn, disclaimer_es: c.disclaimerEs, disclaimer_en: c.disclaimerEn }).eq("id", c.id);
  return error ? error.message : null;
}
export async function savePricingTier(t: PricingTierDraft): Promise<string | null> {
  const p = { name_es: t.nameEs, name_en: t.nameEn, price: t.price, currency: t.currency, billing_period: t.billingPeriod, tagline_es: t.taglineEs, tagline_en: t.taglineEn, features_es: t.featuresEs.map((f) => f.trim()).filter(Boolean), features_en: t.featuresEn.map((f) => f.trim()).filter(Boolean), cta_label_es: t.ctaLabelEs, cta_label_en: t.ctaLabelEn, cta_href: t.ctaHref, is_recommended: t.isRecommended, is_active: t.isActive, display_order: t.displayOrder };
  const res = t.id ? await supabase.from("marketing_pricing_tiers").update(p).eq("id", t.id).select("id").maybeSingle() : await supabase.from("marketing_pricing_tiers").insert(p).select("id").single();
  if (res.error) return res.error.message;
  return t.isRecommended ? clearOtherRecommended((res.data as { id: string }).id) : null;
}
export async function deletePricingTier(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_pricing_tiers").delete().eq("id", id);
  return error ? error.message : null;
}
export async function setTierFields(id: string, patch: Partial<{ is_active: boolean; display_order: number }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_pricing_tiers").update(patch).eq("id", id);
  return error ? error.message : null;
}
export async function setRecommended(id: string, value: boolean): Promise<string | null> {
  const { error } = await supabase.from("marketing_pricing_tiers").update({ is_recommended: value }).eq("id", id);
  if (error) return error.message;
  return value ? clearOtherRecommended(id) : null;
}
