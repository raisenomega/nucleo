import { supabase } from "@shared/lib/supabase";
import type { SolutionRow, SolutionsConfig, SolutionDraft, PillPreset } from "@raisen-marketing/data/solution.types";

const CFG = "id, eyebrow_es, eyebrow_en, title_es, title_en";
const SSEL = "id, icon_name, title_es, title_en, description_es, description_en, bullets_es, bullets_en, cta_label_es, cta_label_en, cta_href, pill_preset, is_highlighted, badge_es, badge_en, is_active, display_order";
const toCfg = (r: Record<string, unknown>): SolutionsConfig => ({ id: r.id as string, eyebrowEs: r.eyebrow_es as string, eyebrowEn: r.eyebrow_en as string, titleEs: r.title_es as string, titleEn: r.title_en as string });
const toRow = (r: Record<string, unknown>): SolutionRow => ({ id: r.id as string, iconName: r.icon_name as string, titleEs: r.title_es as string, titleEn: r.title_en as string, descEs: r.description_es as string, descEn: r.description_en as string, bulletsEs: (r.bullets_es as string[]) ?? [], bulletsEn: (r.bullets_en as string[]) ?? [], ctaLabelEs: r.cta_label_es as string, ctaLabelEn: r.cta_label_en as string, ctaHref: r.cta_href as string, pillPreset: (r.pill_preset as PillPreset) ?? null, isHighlighted: r.is_highlighted === true, badgeEs: (r.badge_es as string) ?? null, badgeEn: (r.badge_en as string) ?? null, isActive: r.is_active !== false, displayOrder: r.display_order as number });

// Solo 1 bloque destacado a la vez: al marcar highlight, los demás pasan a false.
async function clearOtherHighlighted(exceptId: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_solutions").update({ is_highlighted: false }).neq("id", exceptId).eq("is_highlighted", true);
  return error ? error.message : null;
}

export async function getSolutionsConfig(): Promise<SolutionsConfig | null> {
  const { data } = await supabase.from("marketing_solutions_config").select(CFG).limit(1).maybeSingle();
  return data ? toCfg(data as Record<string, unknown>) : null;
}
export async function getSolutions(activeOnly: boolean): Promise<SolutionRow[]> {
  let query = supabase.from("marketing_solutions").select(SSEL).order("display_order");
  if (activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return ((data ?? []) as Record<string, unknown>[]).map(toRow);
}
export async function saveSolutionsConfig(c: SolutionsConfig): Promise<string | null> {
  const { error } = await supabase.from("marketing_solutions_config").update({ eyebrow_es: c.eyebrowEs, eyebrow_en: c.eyebrowEn, title_es: c.titleEs, title_en: c.titleEn }).eq("id", c.id);
  return error ? error.message : null;
}
export async function saveSolution(s: SolutionDraft): Promise<string | null> {
  const p = { icon_name: s.iconName, title_es: s.titleEs, title_en: s.titleEn, description_es: s.descEs, description_en: s.descEn, bullets_es: s.bulletsEs.map((b) => b.trim()).filter(Boolean), bullets_en: s.bulletsEn.map((b) => b.trim()).filter(Boolean), cta_label_es: s.ctaLabelEs, cta_label_en: s.ctaLabelEn, cta_href: s.ctaHref, pill_preset: s.pillPreset, is_highlighted: s.isHighlighted, badge_es: s.isHighlighted ? s.badgeEs : null, badge_en: s.isHighlighted ? s.badgeEn : null, is_active: s.isActive, display_order: s.displayOrder };
  const res = s.id ? await supabase.from("marketing_solutions").update(p).eq("id", s.id).select("id").maybeSingle() : await supabase.from("marketing_solutions").insert(p).select("id").single();
  if (res.error) return res.error.message;
  return s.isHighlighted ? clearOtherHighlighted((res.data as { id: string }).id) : null;
}
export async function deleteSolution(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_solutions").delete().eq("id", id);
  return error ? error.message : null;
}
export async function setSolutionFields(id: string, patch: Partial<{ is_active: boolean; display_order: number }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_solutions").update(patch).eq("id", id);
  return error ? error.message : null;
}
