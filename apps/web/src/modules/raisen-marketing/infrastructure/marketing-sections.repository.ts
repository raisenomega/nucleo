import { supabase } from "@shared/lib/supabase";
import type { SectionRow } from "@raisen-marketing/data/section.types";

const SEL = "id, section_key, label_es, label_en, is_visible, display_order";
const toRow = (o: Record<string, unknown>): SectionRow => ({ id: o.id as string, key: o.section_key as string, labelEs: o.label_es as string, labelEn: o.label_en as string, isVisible: o.is_visible !== false, order: o.display_order as number });

export async function getSections(): Promise<SectionRow[]> {
  const { data } = await supabase.from("marketing_sections").select(SEL).order("display_order");
  return ((data ?? []) as Record<string, unknown>[]).map(toRow);
}
export async function setSectionFields(id: string, patch: Partial<{ is_visible: boolean; display_order: number }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_sections").update(patch).eq("id", id);
  return error ? error.message : null;
}
