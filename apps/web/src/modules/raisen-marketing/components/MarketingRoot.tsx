import "@raisen-marketing/styles/marketing.css";
import { useState } from "react";
import { usePageview } from "@shared/analytics/track";
import { useMarketingLang } from "@raisen-marketing/hooks/useMarketingLang";
import { useMarketingHero } from "@raisen-marketing/hooks/useMarketingHero";
import { useMarketingSections } from "@raisen-marketing/hooks/useMarketingSections";
import { HeroMediaBackground } from "@raisen-marketing/components/hero/HeroMediaBackground";
import { MarketingNav } from "@raisen-marketing/components/nav/MarketingNav";
import { MarketingFooter } from "@raisen-marketing/components/footer/MarketingFooter";
import { renderSection } from "@raisen-marketing/components/section-render";
import { SECTIONS_FALLBACK } from "@raisen-marketing/data/sections-fallback";
import { LandingDataContext } from "@raisen-marketing/data/landing-data.context";
import type { LandingData } from "@raisen-marketing/data/landing-data.types";
import type { Audience } from "@raisen-marketing/data/solutions";

// `ssr` = snapshot completo resuelto en el loader de "/". Va por contexto y no por props porque el contenido
// se separa en su propio componente: los hooks viven DENTRO del provider, que es la única forma de que lo
// vean (si MarketingRoot los llamara directamente, quedarían fuera de su propio Provider).
export default function MarketingRoot({ ssr }: { ssr?: LandingData | null } = {}) {
  return (
    <LandingDataContext.Provider value={ssr ?? null}>
      <MarketingContent />
    </LandingDataContext.Provider>
  );
}

// Contenido de la landing (DNA dorado OMEGA). Fondo 3D fixed z-0 + contenido z-10. Las secciones se
// renderizan según marketing_sections (visibilidad + orden, editable en /web/secciones); fallback = orden real.
function MarketingContent() {
  usePageview();
  const { lang, toggleLang } = useMarketingLang();
  const hero = useMarketingHero();
  const sections = useMarketingSections();
  const [audience, setAudience] = useState<Audience>("business");
  const list = (sections ?? SECTIONS_FALLBACK).filter((s) => s.isVisible).sort((a, b) => a.order - b.order);
  const ctx = { lang, hero, audience, setAudience };
  const es = lang === "es";
  const navCtaLabel = hero ? (es ? hero.navCtaLabelEs : hero.navCtaLabelEn) : (es ? "Solicitar demo" : "Book a demo");
  const navCtaHref = hero?.navCtaHref ?? "/demo";
  return (
    <div className="rm-root min-h-screen">
      <HeroMediaBackground hero={hero} />
      <div className="relative z-10">
        <MarketingNav lang={lang} toggleLang={toggleLang} navCtaLabel={navCtaLabel} navCtaHref={navCtaHref} />
        <main>{list.map((s) => renderSection(s.key, ctx))}</main>
        <MarketingFooter lang={lang} />
      </div>
    </div>
  );
}
