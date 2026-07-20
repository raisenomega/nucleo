import { supabase } from "@shared/lib/supabase";
import type { SocialLink, SocialLinkDraft } from "@raisen-marketing/data/footer.types";

const SEL = "id, platform, url, icon_name, display_order, is_active";
const toRow = (o: Record<string, unknown>): SocialLink => ({ id: o.id as string, platform: o.platform as string, url: o.url as string, iconName: o.icon_name as string, displayOrder: o.display_order as number, isActive: o.is_active !== false });

export async function getSocialLinks(activeOnly: boolean): Promise<SocialLink[]> {
  let q = supabase.from("marketing_footer_social_links").select(SEL).order("display_order");
  if (activeOnly) q = q.eq("is_active", true);
  const { data } = await q;
  return ((data ?? []) as Record<string, unknown>[]).map(toRow);
}
export async function saveSocialLink(s: SocialLinkDraft): Promise<string | null> {
  const p = { platform: s.platform, url: s.url, icon_name: s.iconName, display_order: s.displayOrder, is_active: s.isActive };
  const { error } = s.id ? await supabase.from("marketing_footer_social_links").update(p).eq("id", s.id) : await supabase.from("marketing_footer_social_links").insert(p);
  return error ? error.message : null;
}
export async function deleteSocialLink(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_footer_social_links").delete().eq("id", id);
  return error ? error.message : null;
}
export async function setSocialFields(id: string, patch: Partial<{ is_active: boolean; display_order: number }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_footer_social_links").update(patch).eq("id", id);
  return error ? error.message : null;
}
