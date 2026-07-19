import "@raisen-marketing/styles/marketing.css";
import { useMarketingLang } from "@raisen-marketing/hooks/useMarketingLang";
import { MarketingNav } from "@raisen-marketing/components/nav/MarketingNav";
import { MarketingHero } from "@raisen-marketing/components/hero/MarketingHero";
import { MarketingFeatures } from "@raisen-marketing/components/features/MarketingFeatures";
import { MarketingProcess } from "@raisen-marketing/components/process/MarketingProcess";
import { MarketingPricing } from "@raisen-marketing/components/pricing/MarketingPricing";
import { MarketingTestimonials } from "@raisen-marketing/components/testimonials/MarketingTestimonials";
import { MarketingLeadForm } from "@raisen-marketing/components/lead/MarketingLeadForm";
import { MarketingFooter } from "@raisen-marketing/components/footer/MarketingFooter";

// Root de la landing comercial. Maneja el idioma y lo pasa a todas las secciones. Default export para lazy.
export default function MarketingRoot() {
  const { lang, toggleLang } = useMarketingLang();
  return (
    <div className="rm-root min-h-screen">
      <MarketingNav lang={lang} toggleLang={toggleLang} />
      <main>
        <MarketingHero lang={lang} />
        <MarketingFeatures lang={lang} />
        <MarketingProcess lang={lang} />
        <MarketingPricing lang={lang} />
        <MarketingTestimonials lang={lang} />
        <MarketingLeadForm lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
