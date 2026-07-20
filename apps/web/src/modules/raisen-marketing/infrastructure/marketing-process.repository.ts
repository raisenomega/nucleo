import { supabase } from "@shared/lib/supabase";
import type { ProcessStepRow, ProcessConfig, ProcessStepDraft } from "@raisen-marketing/data/process.types";

const CFG = "id, eyebrow_es, eyebrow_en, title_es, title_en";
const SSEL = "id, step_number, icon_name, title_es, title_en, description_es, description_en, display_order, is_active";
const toCfg = (r: Record<string, unknown>): ProcessConfig => ({ id: r.id as string, eyebrowEs: r.eyebrow_es as string, eyebrowEn: r.eyebrow_en as string, titleEs: r.title_es as string, titleEn: r.title_en as string });
const toRow = (r: Record<string, unknown>): ProcessStepRow => ({ id: r.id as string, stepNumber: r.step_number as number, iconName: r.icon_name as string, titleEs: r.title_es as string, titleEn: r.title_en as string, descEs: r.description_es as string, descEn: r.description_en as string, displayOrder: r.display_order as number, isActive: r.is_active !== false });

export async function getProcessConfig(): Promise<ProcessConfig | null> {
  const { data } = await supabase.from("marketing_process_config").select(CFG).limit(1).maybeSingle();
  return data ? toCfg(data as Record<string, unknown>) : null;
}
export async function getProcessSteps(activeOnly: boolean): Promise<ProcessStepRow[]> {
  let query = supabase.from("marketing_process_steps").select(SSEL).order("display_order");
  if (activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return ((data ?? []) as Record<string, unknown>[]).map(toRow);
}
export async function saveProcessConfig(c: ProcessConfig): Promise<string | null> {
  const { error } = await supabase.from("marketing_process_config").update({ eyebrow_es: c.eyebrowEs, eyebrow_en: c.eyebrowEn, title_es: c.titleEs, title_en: c.titleEn }).eq("id", c.id);
  return error ? error.message : null;
}
export async function saveProcessStep(s: ProcessStepDraft): Promise<string | null> {
  const p = { step_number: s.stepNumber, icon_name: s.iconName, title_es: s.titleEs, title_en: s.titleEn, description_es: s.descEs, description_en: s.descEn, display_order: s.displayOrder, is_active: s.isActive };
  const { error } = s.id ? await supabase.from("marketing_process_steps").update(p).eq("id", s.id) : await supabase.from("marketing_process_steps").insert(p);
  return error ? error.message : null;
}
export async function deleteProcessStep(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_process_steps").delete().eq("id", id);
  return error ? error.message : null;
}
export async function setStepFields(id: string, patch: Partial<{ is_active: boolean; display_order: number }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_process_steps").update(patch).eq("id", id);
  return error ? error.message : null;
}
