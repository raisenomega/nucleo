import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { PricingTier } from "@raisen-marketing/data/pricing-tiers";
import type { Lang } from "@raisen-marketing/data/copy";

const scrollToForm = () => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });

// Tier de precios (glass). Recomendado → borde violet + shadow + badge. Precio + features con Check + CTA.
export function PricingTierCard({ tier, index, lang, period, badge }: { tier: PricingTier; index: number; lang: Lang; period: string; badge: string }) {
  const es = lang === "es";
  const features = es ? tier.featuresEs : tier.featuresEn;
  const rec = tier.isRecommended ? "border-violet-500/40 shadow-lg shadow-violet-500/10" : "border-white/[0.08]";
  return (
    <motion.div className={`relative rounded-2xl border bg-white/[0.03] p-7 backdrop-blur-sm ${rec}`}
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }}>
      {tier.isRecommended && <span className="absolute -top-3 left-7 rounded-full bg-violet-500 px-2 py-0.5 text-xs text-white">{badge}</span>}
      <h3 className="text-lg font-semibold text-white">{es ? tier.nameEs : tier.nameEn}</h3>
      <p className="mt-1 text-sm text-white/40">{es ? tier.taglineEs : tier.taglineEn}</p>
      <div className="mt-4"><span className="text-3xl font-bold text-violet-400">${tier.price}</span><span className="text-sm text-white/40">{period}</span></div>
      <ul className="mt-6 space-y-3">
        {features.map((ft) => <li key={ft} className="flex items-start gap-2 text-sm text-white/70"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />{ft}</li>)}
      </ul>
      <button type="button" onClick={scrollToForm}
        className="mt-7 w-full rounded-lg bg-violet-500 py-3 text-center text-sm font-semibold text-white transition-transform hover:scale-[1.02]">{es ? tier.ctaLabelEs : tier.ctaLabelEn}</button>
    </motion.div>
  );
}
