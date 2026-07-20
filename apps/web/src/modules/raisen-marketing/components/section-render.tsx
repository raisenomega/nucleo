import type { ReactNode } from "react";
import { MarketingHero } from "@raisen-marketing/components/hero/MarketingHero";
import { MarketingFeatures } from "@raisen-marketing/components/features/MarketingFeatures";
import { MarketingProcess } from "@raisen-marketing/components/process/MarketingProcess";
import { MarketingSolutions } from "@raisen-marketing/components/solutions/MarketingSolutions";
import { MarketingPricing } from "@raisen-marketing/components/pricing/MarketingPricing";
import { MarketingTestimonials } from "@raisen-marketing/components/testimonials/MarketingTestimonials";
import { MarketingLeadForm } from "@raisen-marketing/components/lead/MarketingLeadForm";
import { useMarketingHero } from "@raisen-marketing/hooks/useMarketingHero";
import type { Audience } from "@raisen-marketing/data/solutions";
import type { Lang } from "@raisen-marketing/data/copy";

export interface SectionCtx { lang: Lang; hero: ReturnType<typeof useMarketingHero>; audience: Audience; setAudience: (a: Audience) => void }

// Mapa section_key → componente con sus props reales (Hero/Solutions/LeadForm difieren del resto). MarketingRoot
// renderiza solo las visibles en orden de display_order. Footer/Nav/fondo 3D van aparte (siempre presentes).
export function renderSection(key: string, ctx: SectionCtx): ReactNode {
  const { lang, hero, audience, setAudience } = ctx;
  switch (key) {
    case "hero": return <MarketingHero key={key} lang={lang} hero={hero} />;
    case "features": return <MarketingFeatures key={key} lang={lang} />;
    case "process": return <MarketingProcess key={key} lang={lang} />;
    case "solutions": return <MarketingSolutions key={key} lang={lang} setAudience={setAudience} />;
    case "pricing": return <MarketingPricing key={key} lang={lang} />;
    case "testimonials": return <MarketingTestimonials key={key} lang={lang} />;
    case "lead_form": return <MarketingLeadForm key={key} lang={lang} audience={audience} setAudience={setAudience} />;
    default: return null;
  }
}
