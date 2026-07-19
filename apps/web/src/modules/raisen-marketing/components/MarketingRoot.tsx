import "@raisen-marketing/styles/marketing.css";
import { useState } from "react";
import { useMarketingLang } from "@raisen-marketing/hooks/useMarketingLang";
import { HeroBackground } from "@raisen-marketing/components/hero-scene/HeroBackground";
import { MarketingNav } from "@raisen-marketing/components/nav/MarketingNav";
import { MarketingHero } from "@raisen-marketing/components/hero/MarketingHero";
import { MarketingFeatures } from "@raisen-marketing/components/features/MarketingFeatures";
import { MarketingProcess } from "@raisen-marketing/components/process/MarketingProcess";
import { MarketingSolutions } from "@raisen-marketing/components/solutions/MarketingSolutions";
import { MarketingPricing } from "@raisen-marketing/components/pricing/MarketingPricing";
import { MarketingTestimonials } from "@raisen-marketing/components/testimonials/MarketingTestimonials";
import { MarketingLeadForm } from "@raisen-marketing/components/lead/MarketingLeadForm";
import { MarketingFooter } from "@raisen-marketing/components/footer/MarketingFooter";
import type { Audience } from "@raisen-marketing/data/solutions";

// Root de la landing comercial (DNA dorado OMEGA). Fondo 3D fixed z-0 + contenido z-10. Default export → lazy.
export default function MarketingRoot() {
  const { lang, toggleLang } = useMarketingLang();
  const [audience, setAudience] = useState<Audience>("business");
  const onCta = (a: Audience) => { setAudience(a); document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" }); };
  return (
    <div className="rm-root min-h-screen">
      <HeroBackground />
      <div className="relative z-10">
        <MarketingNav lang={lang} toggleLang={toggleLang} />
        <main>
          <MarketingHero lang={lang} />
          <MarketingFeatures lang={lang} />
          <MarketingProcess lang={lang} />
          <MarketingSolutions lang={lang} onCta={onCta} />
          <MarketingPricing lang={lang} />
          <MarketingTestimonials lang={lang} />
          <MarketingLeadForm lang={lang} audience={audience} setAudience={setAudience} />
        </main>
        <MarketingFooter lang={lang} />
      </div>
    </div>
  );
}
