import { supabase } from "@shared/lib/supabase";
import type { LegalPageRow, LegalLink, LegalDraft } from "@raisen-marketing/data/legal.types";

const SEL = "id, slug, title_es, title_en, content_es, content_en, is_active, display_order";
const toRow = (o: Record<string, unknown>): LegalPageRow => ({ id: o.id as string, slug: o.slug as string, titleEs: o.title_es as string, titleEn: o.title_en as string, contentEs: (o.content_es as string) ?? "", contentEn: (o.content_en as string) ?? "", isActive: o.is_active !== false, displayOrder: o.display_order as number });

export async function getLegalPage(slug: string): Promise<LegalPageRow | null> {
  const { data } = await supabase.from("marketing_legal_pages").select(SEL).eq("slug", slug).maybeSingle();
  return data ? toRow(data as Record<string, unknown>) : null;
}
export async function getLegalPages(): Promise<LegalPageRow[]> {
  const { data } = await supabase.from("marketing_legal_pages").select(SEL).order("display_order");
  return ((data ?? []) as Record<string, unknown>[]).map(toRow);
}
export async function getLegalLinks(): Promise<LegalLink[]> {
  const { data } = await supabase.from("marketing_legal_pages").select("slug, title_es, title_en").eq("is_active", true).order("display_order");
  return ((data ?? []) as Record<string, unknown>[]).map((o) => ({ slug: o.slug as string, titleEs: o.title_es as string, titleEn: o.title_en as string }));
}
export async function saveLegalPage(d: LegalDraft): Promise<string | null> {
  const p = { slug: d.slug, title_es: d.titleEs, title_en: d.titleEn, content_es: d.contentEs, content_en: d.contentEn, is_active: d.isActive, display_order: d.displayOrder };
  const { error } = d.id ? await supabase.from("marketing_legal_pages").update(p).eq("id", d.id) : await supabase.from("marketing_legal_pages").insert(p);
  return error ? error.message : null;
}
export async function deleteLegalPage(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_legal_pages").delete().eq("id", id);
  return error ? error.message : null;
}
export async function setLegalFields(id: string, patch: Partial<{ is_active: boolean; display_order: number }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_legal_pages").update(patch).eq("id", id);
  return error ? error.message : null;
}
