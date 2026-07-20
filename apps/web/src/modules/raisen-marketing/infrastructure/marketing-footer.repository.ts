import { supabase } from "@shared/lib/supabase";
import type { FooterRow } from "@raisen-marketing/data/footer.types";

const s = (o: Record<string, unknown>, k: string) => (o[k] as string) ?? null;
const toRow = (o: Record<string, unknown>): FooterRow => ({
  id: o.id as string, taglineEs: (o.tagline_es as string) ?? "", taglineEn: (o.tagline_en as string) ?? "",
  contactEmail: s(o, "contact_email"), contactPhone: s(o, "contact_phone"),
  copyrightEs: (o.copyright_es as string) ?? "", copyrightEn: (o.copyright_en as string) ?? "",
});

export async function getFooter(): Promise<FooterRow | null> {
  const { data } = await supabase.from("marketing_footer").select("*").limit(1).maybeSingle();
  return data ? toRow(data as Record<string, unknown>) : null;
}
export async function saveFooter(f: FooterRow): Promise<string | null> {
  const { error } = await supabase.from("marketing_footer").update({
    tagline_es: f.taglineEs, tagline_en: f.taglineEn,
    contact_email: f.contactEmail || null, contact_phone: f.contactPhone || null,
    copyright_es: f.copyrightEs, copyright_en: f.copyrightEn,
  }).eq("id", f.id);
  return error ? error.message : null;
}
