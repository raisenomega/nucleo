import { supabase } from "@shared/lib/supabase";
import type { TestimonialRow, TestimonialsConfig, TestimonialDraft } from "@raisen-marketing/data/testimonial.types";

const CFG = "id, eyebrow_es, eyebrow_en, title_es, title_en";
const TSEL = "id, quote_es, quote_en, client_name, client_company, client_role, avatar_url, rating, is_active, display_order";
const toCfg = (r: Record<string, unknown>): TestimonialsConfig => ({ id: r.id as string, eyebrowEs: r.eyebrow_es as string, eyebrowEn: r.eyebrow_en as string, titleEs: r.title_es as string, titleEn: r.title_en as string });
const toRow = (r: Record<string, unknown>): TestimonialRow => ({ id: r.id as string, quoteEs: r.quote_es as string, quoteEn: r.quote_en as string, clientName: r.client_name as string, clientCompany: (r.client_company as string) ?? null, clientRole: (r.client_role as string) ?? null, avatarUrl: (r.avatar_url as string) ?? null, rating: (r.rating as number) ?? 5, isActive: r.is_active !== false, displayOrder: r.display_order as number });

export async function getTestimonialsConfig(): Promise<TestimonialsConfig | null> {
  const { data } = await supabase.from("marketing_testimonials_config").select(CFG).limit(1).maybeSingle();
  return data ? toCfg(data as Record<string, unknown>) : null;
}
export async function getTestimonials(activeOnly: boolean): Promise<TestimonialRow[]> {
  let query = supabase.from("marketing_testimonials").select(TSEL).order("display_order");
  if (activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return ((data ?? []) as Record<string, unknown>[]).map(toRow);
}
export async function saveTestimonialsConfig(c: TestimonialsConfig): Promise<string | null> {
  const { error } = await supabase.from("marketing_testimonials_config").update({ eyebrow_es: c.eyebrowEs, eyebrow_en: c.eyebrowEn, title_es: c.titleEs, title_en: c.titleEn }).eq("id", c.id);
  return error ? error.message : null;
}
export async function saveTestimonial(t: TestimonialDraft): Promise<string | null> {
  const p = { quote_es: t.quoteEs, quote_en: t.quoteEn, client_name: t.clientName, client_company: t.clientCompany || null, client_role: t.clientRole || null, avatar_url: t.avatarUrl || null, rating: t.rating, is_active: t.isActive, display_order: t.displayOrder };
  const { error } = t.id ? await supabase.from("marketing_testimonials").update(p).eq("id", t.id) : await supabase.from("marketing_testimonials").insert(p);
  return error ? error.message : null;
}
export async function deleteTestimonial(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_testimonials").delete().eq("id", id);
  return error ? error.message : null;
}
export async function setTestimonialFields(id: string, patch: Partial<{ is_active: boolean; display_order: number }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_testimonials").update(patch).eq("id", id);
  return error ? error.message : null;
}
