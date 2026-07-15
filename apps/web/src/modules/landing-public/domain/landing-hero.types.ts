import type { ItemHighlight } from "@shared/types/item-highlight.types";

// Sección hero secundaria de un item (landing_hero jsonb). Contenido editable por tenant, resuelto por RPC anon.
export interface HeroTarget { id: string; name: string; basePrice: number }
export interface LandingHeroSection {
  kind: "product" | "service" | "package"; id: string; slug: string; name: string; basePrice: number;
  titleEs: string; titleEn: string; subtitleEs: string; subtitleEn: string;
  descriptionEs: string; descriptionEn: string; imageUrl: string | null; features: ItemHighlight[];
  ctaPrimaryEs: string; ctaPrimaryEn: string;
  ctaSecondaryEs: string | null; ctaSecondaryEn: string | null; secondaryTarget: HeroTarget | null;
}
