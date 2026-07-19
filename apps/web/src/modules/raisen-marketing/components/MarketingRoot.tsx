import "@raisen-marketing/styles/marketing.css";
import { MarketingNav } from "@raisen-marketing/components/nav/MarketingNav";
import { MarketingHero } from "@raisen-marketing/components/hero/MarketingHero";
import { MarketingFeatures } from "@raisen-marketing/components/features/MarketingFeatures";

// Root de la landing comercial de Raisen/NÚCLEO. Default export para lazy load. Aislado en .rm-root.
export default function MarketingRoot() {
  return (
    <div className="rm-root min-h-screen">
      <MarketingNav />
      <main>
        <MarketingHero />
        <MarketingFeatures />
      </main>
    </div>
  );
}
