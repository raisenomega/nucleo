import { supabase } from "@shared/lib/supabase";
import type { MarketingFeatureRow, FeaturesConfig, FeatureDraft } from "@raisen-marketing/data/feature.types";

const CFG = "id, eyebrow_es, eyebrow_en, title_es, title_en";
const FSEL = "id, icon_name, title_es, title_en, description_es, description_en, bullets_es, bullets_en, display_order, col_span, is_active";
const toCfg = (r: Record<string, unknown>): FeaturesConfig => ({ id: r.id as string, eyebrowEs: r.eyebrow_es as string, eyebrowEn: r.eyebrow_en as string, titleEs: r.title_es as string, titleEn: r.title_en as string });
const toRow = (r: Record<string, unknown>): MarketingFeatureRow => ({ id: r.id as string, iconName: r.icon_name as string, titleEs: r.title_es as string, titleEn: r.title_en as string, descEs: r.description_es as string, descEn: r.description_en as string, bulletsEs: (r.bullets_es as string[]) ?? [], bulletsEn: (r.bullets_en as string[]) ?? [], displayOrder: r.display_order as number, colSpan: r.col_span as number, isActive: r.is_active !== false });

export async function getFeaturesConfig(): Promise<FeaturesConfig | null> {
  const { data } = await supabase.from("marketing_features_config").select(CFG).limit(1).maybeSingle();
  return data ? toCfg(data as Record<string, unknown>) : null;
}
export async function getFeatures(activeOnly: boolean): Promise<MarketingFeatureRow[]> {
  let query = supabase.from("marketing_features").select(FSEL).order("display_order");
  if (activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return ((data ?? []) as Record<string, unknown>[]).map(toRow);
}
export async function saveFeaturesConfig(c: FeaturesConfig): Promise<string | null> {
  const { error } = await supabase.from("marketing_features_config").update({ eyebrow_es: c.eyebrowEs, eyebrow_en: c.eyebrowEn, title_es: c.titleEs, title_en: c.titleEn }).eq("id", c.id);
  return error ? error.message : null;
}
export async function saveFeature(f: FeatureDraft): Promise<string | null> {
  const p = { icon_name: f.iconName, title_es: f.titleEs, title_en: f.titleEn, description_es: f.descEs, description_en: f.descEn, bullets_es: f.bulletsEs.map((b) => b.trim()).filter(Boolean), bullets_en: f.bulletsEn.map((b) => b.trim()).filter(Boolean), display_order: f.displayOrder, col_span: f.colSpan, is_active: f.isActive };
  const { error } = f.id ? await supabase.from("marketing_features").update(p).eq("id", f.id) : await supabase.from("marketing_features").insert(p);
  return error ? error.message : null;
}
export async function deleteFeature(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_features").delete().eq("id", id);
  return error ? error.message : null;
}
export async function setFeatureFields(id: string, patch: Partial<{ is_active: boolean; display_order: number }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_features").update(patch).eq("id", id);
  return error ? error.message : null;
}
