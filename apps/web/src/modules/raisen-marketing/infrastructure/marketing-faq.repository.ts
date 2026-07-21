import { supabase } from "@shared/lib/supabase";
import type { FaqRow, FaqConfig, FaqDraft } from "@raisen-marketing/data/faq.types";

const CFG = "id, eyebrow_es, eyebrow_en, title_es, title_en";
const SEL = "id, question_es, question_en, answer_es, answer_en, is_active, display_order";
const toCfg = (r: Record<string, unknown>): FaqConfig => ({ id: r.id as string, eyebrowEs: r.eyebrow_es as string, eyebrowEn: r.eyebrow_en as string, titleEs: r.title_es as string, titleEn: r.title_en as string });
const toRow = (r: Record<string, unknown>): FaqRow => ({ id: r.id as string, questionEs: r.question_es as string, questionEn: r.question_en as string, answerEs: r.answer_es as string, answerEn: r.answer_en as string, isActive: r.is_active !== false, displayOrder: r.display_order as number });

export async function getFaqConfig(): Promise<FaqConfig | null> {
  const { data } = await supabase.from("marketing_faq_config").select(CFG).limit(1).maybeSingle();
  return data ? toCfg(data as Record<string, unknown>) : null;
}
export async function getFaqs(activeOnly: boolean): Promise<FaqRow[]> {
  let q = supabase.from("marketing_faqs").select(SEL).order("display_order");
  if (activeOnly) q = q.eq("is_active", true);
  const { data } = await q;
  return ((data ?? []) as Record<string, unknown>[]).map(toRow);
}
export async function saveFaqConfig(c: FaqConfig): Promise<string | null> {
  const { error } = await supabase.from("marketing_faq_config").update({ eyebrow_es: c.eyebrowEs, eyebrow_en: c.eyebrowEn, title_es: c.titleEs, title_en: c.titleEn }).eq("id", c.id);
  return error ? error.message : null;
}
export async function saveFaq(f: FaqDraft): Promise<string | null> {
  const p = { question_es: f.questionEs, question_en: f.questionEn, answer_es: f.answerEs, answer_en: f.answerEn, is_active: f.isActive, display_order: f.displayOrder };
  const res = f.id ? await supabase.from("marketing_faqs").update(p).eq("id", f.id) : await supabase.from("marketing_faqs").insert(p);
  return res.error ? res.error.message : null;
}
export async function deleteFaq(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_faqs").delete().eq("id", id);
  return error ? error.message : null;
}
export async function setFaqFields(id: string, patch: Partial<{ is_active: boolean; display_order: number }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_faqs").update(patch).eq("id", id);
  return error ? error.message : null;
}
