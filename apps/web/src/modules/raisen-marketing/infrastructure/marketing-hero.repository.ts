import { supabase } from "@shared/lib/supabase";
import type { MarketingHeroRow } from "@raisen-marketing/data/hero.types";

const SEL = "id, title_es, title_en, subtitle_es, subtitle_en, cta_label_es, cta_label_en, scroll_text, cta_href, background_video_url, background_image_url, media_overlay_opacity, show_scroll_indicator, show_3d_scene";

const toRow = (r: Record<string, unknown>): MarketingHeroRow => ({
  id: r.id as string,
  titleEs: r.title_es as string, titleEn: r.title_en as string,
  subtitleEs: r.subtitle_es as string, subtitleEn: r.subtitle_en as string,
  ctaLabelEs: r.cta_label_es as string, ctaLabelEn: r.cta_label_en as string,
  scrollText: r.scroll_text as string, ctaHref: r.cta_href as string,
  backgroundVideoUrl: (r.background_video_url as string | null) ?? null,
  backgroundImageUrl: (r.background_image_url as string | null) ?? null,
  mediaOverlayOpacity: Number(r.media_overlay_opacity),
  showScrollIndicator: r.show_scroll_indicator !== false,
  show3dScene: r.show_3d_scene !== false,
});

// Lectura pública (landing anónima · RLS select=true). Fila única.
export async function getMarketingHero(): Promise<MarketingHeroRow | null> {
  const { data } = await supabase.from("marketing_hero").select(SEL).limit(1).maybeSingle();
  return data ? toRow(data as Record<string, unknown>) : null;
}

// Escritura Super Admin (RLS is_superadmin()). Persiste todos los campos editables. Devuelve error o null.
export async function saveMarketingHero(r: MarketingHeroRow): Promise<string | null> {
  const { error } = await supabase.from("marketing_hero").update({
    title_es: r.titleEs, title_en: r.titleEn, subtitle_es: r.subtitleEs, subtitle_en: r.subtitleEn,
    cta_label_es: r.ctaLabelEs, cta_label_en: r.ctaLabelEn, scroll_text: r.scrollText, cta_href: r.ctaHref,
    background_video_url: r.backgroundVideoUrl, background_image_url: r.backgroundImageUrl,
    media_overlay_opacity: r.mediaOverlayOpacity, show_scroll_indicator: r.showScrollIndicator, show_3d_scene: r.show3dScene,
  }).eq("id", r.id);
  return error ? error.message : null;
}
