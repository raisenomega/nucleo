import { useScrollReveal } from "@raisen-marketing/hooks/useScrollReveal";
import { TIERS } from "@raisen-marketing/data/pricing-tiers";
import { PricingTierCard } from "@raisen-marketing/components/pricing/PricingTierCard";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// Sección Precios (réplica OMEGA): divisor dorado, header reveal, grid de 3 tiers.
export function MarketingPricing({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="pricing" ref={ref} className="relative overflow-hidden px-6 py-16 md:py-20">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className={`relative z-10 mx-auto max-w-6xl transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">{c.pricingTitle}</h2>
          <p className="mx-auto max-w-lg text-muted-foreground">{c.pricingSubtitle}</p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TIERS.map((t) => <PricingTierCard key={t.nameEs} tier={t} lang={lang} recommendedLabel={c.pricingRecommended} cta={c.pricingCta} />)}
        </div>
      </div>
    </section>
  );
}
