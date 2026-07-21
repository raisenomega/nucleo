import { useScrollReveal } from "@raisen-marketing/hooks/useScrollReveal";
import { useMarketingPricing } from "@raisen-marketing/hooks/useMarketingPricing";
import { PRICING_TIERS_FALLBACK, PRICING_CONFIG_FALLBACK } from "@raisen-marketing/data/pricing-tiers";
import { useMarketingAddons } from "@raisen-marketing/hooks/useMarketingAddons";
import { PricingTierCard } from "@raisen-marketing/components/pricing/PricingTierCard";
import { PricingAddonCard } from "@raisen-marketing/components/pricing/PricingAddonCard";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// Sección Precios (réplica OMEGA): divisor dorado, header reveal, grid de tiers. Lee config+tiers de la DB
// (editable en /web/precios) y cae al fallback si Supabase aún no responde o no hay tiers activos.
export function MarketingPricing({ lang }: { lang: Lang }) {
  const es = lang === "es";
  const c = COPY[lang];
  const { config, tiers } = useMarketingPricing();
  const addons = useMarketingAddons();
  const cfg = config ?? PRICING_CONFIG_FALLBACK;
  const items = tiers && tiers.length ? tiers : PRICING_TIERS_FALLBACK;
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="pricing" aria-labelledby="pricing-title" ref={ref} className="relative overflow-hidden px-6 py-16 md:py-20">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className={`relative z-10 mx-auto max-w-6xl transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">{es ? cfg.eyebrowEs : cfg.eyebrowEn}</p>
          <h2 id="pricing-title" className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">{es ? cfg.titleEs : cfg.titleEn}</h2>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => <PricingTierCard key={t.id} tier={t} lang={lang} recommendedLabel={c.pricingRecommended} />)}
        </div>
        {addons.length > 0 && (
          <div className="mt-16">
            <div className="mb-8 text-center">
              <h3 className="font-display text-2xl font-bold text-foreground md:text-3xl">{es ? "Complementos" : "Add-ons"}</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{es ? "Suma capacidades a cualquier plan." : "Add capabilities to any plan."}</p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {addons.map((a) => <PricingAddonCard key={a.id} addon={a} lang={lang} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
