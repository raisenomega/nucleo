import "@raisen-marketing/styles/marketing.css";
import { useState } from "react";
import { useMarketingLang } from "@raisen-marketing/hooks/useMarketingLang";
import { useMarketingHero } from "@raisen-marketing/hooks/useMarketingHero";
import { useMarketingSections } from "@raisen-marketing/hooks/useMarketingSections";
import { HeroMediaBackground } from "@raisen-marketing/components/hero/HeroMediaBackground";
import { MarketingNav } from "@raisen-marketing/components/nav/MarketingNav";
import { MarketingFooter } from "@raisen-marketing/components/footer/MarketingFooter";
import { renderSection } from "@raisen-marketing/components/section-render";
import { SECTIONS_FALLBACK } from "@raisen-marketing/data/sections-fallback";
import type { Audience } from "@raisen-marketing/data/solutions";

// Root de la landing comercial (DNA dorado OMEGA). Fondo 3D fixed z-0 + contenido z-10. Las secciones se
// renderizan según marketing_sections (visibilidad + orden, editable en /web/secciones); fallback = orden real.
export default function MarketingRoot() {
  const { lang, toggleLang } = useMarketingLang();
  const hero = useMarketingHero();
  const sections = useMarketingSections();
  const [audience, setAudience] = useState<Audience>("business");
  const list = (sections ?? SECTIONS_FALLBACK).filter((s) => s.isVisible).sort((a, b) => a.order - b.order);
  const ctx = { lang, hero, audience, setAudience };
  return (
    <div className="rm-root min-h-screen">
      <HeroMediaBackground hero={hero} />
      <div className="relative z-10">
        <MarketingNav lang={lang} toggleLang={toggleLang} />
        <main>{list.map((s) => renderSection(s.key, ctx))}</main>
        <MarketingFooter lang={lang} />
      </div>
    </div>
  );
}
