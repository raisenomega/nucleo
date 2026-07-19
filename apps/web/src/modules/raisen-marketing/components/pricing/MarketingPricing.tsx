import { motion } from "framer-motion";
import { TIERS } from "@raisen-marketing/data/pricing-tiers";
import { PricingTierCard } from "@raisen-marketing/components/pricing/PricingTierCard";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// Sección Pricing: eyebrow + H2 + grid 3 tiers.
export function MarketingPricing({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  return (
    <section id="precios" className="mx-auto max-w-6xl px-6 py-32">
      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <p className="text-sm font-medium uppercase tracking-widest text-violet-400">{c.pricingEyebrow}</p>
        <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">{c.pricingTitle}</h2>
      </motion.div>
      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TIERS.map((t, i) => <PricingTierCard key={t.nameEs} tier={t} index={i} lang={lang} period={c.pricingPeriod} badge={c.pricingBadge} />)}
      </div>
    </section>
  );
}
