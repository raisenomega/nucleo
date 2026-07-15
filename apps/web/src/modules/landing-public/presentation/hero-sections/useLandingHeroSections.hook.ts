import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { createTtlCache } from "@shared/lib/ttl-cache";
import { TTL_SHORT_60S } from "@shared/lib/ttl-cache.constants";
import type { ItemHighlight } from "@shared/types/item-highlight.types";
import type { LandingHeroSection } from "@landing-public/domain/landing-hero.types";

type Row = { kind: string; id: string; slug: string; name: string; base_price: number | string;
  hero: Record<string, unknown>; secondary_target: { id: string; name: string; base_price: number | string } | null };
const cache = createTtlCache<LandingHeroSection[]>(TTL_SHORT_60S);
const str = (h: Record<string, unknown>, k: string) => (h[k] as string) ?? "";

function toSection(r: Row): LandingHeroSection {
  const h = r.hero ?? {};
  const t = r.secondary_target;
  return {
    kind: r.kind as LandingHeroSection["kind"], id: r.id, slug: r.slug, name: r.name, basePrice: Number(r.base_price) || 0,
    titleEs: str(h, "title_es"), titleEn: str(h, "title_en"), subtitleEs: str(h, "subtitle_es"), subtitleEn: str(h, "subtitle_en"),
    descriptionEs: str(h, "description_es"), descriptionEn: str(h, "description_en"), imageUrl: (h.image_url as string) ?? null,
    features: (Array.isArray(h.features) ? h.features : []) as ItemHighlight[],
    ctaPrimaryEs: str(h, "cta_primary_label_es"), ctaPrimaryEn: str(h, "cta_primary_label_en"),
    ctaSecondaryEs: (h.cta_secondary_label_es as string) ?? null, ctaSecondaryEn: (h.cta_secondary_label_en as string) ?? null,
    secondaryTarget: t ? { id: t.id, name: t.name, basePrice: Number(t.base_price) || 0 } : null,
  };
}

// Secciones hero activas del tenant (RPC anon _public_landing_hero_sections). Cache TTL 60s por host.
export function useLandingHeroSections(): LandingHeroSection[] {
  const [sections, setSections] = useState<LandingHeroSection[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = window.location.hostname;
    const c = cache.get(key);
    if (c) { setSections(c); return; }
    void supabase.rpc("_public_landing_hero_sections", { _hostname: key }).then(({ data }) => {
      const v = ((data ?? []) as Row[]).map(toSection); cache.set(key, v); setSections(v);
    });
  }, []);
  return sections;
}
