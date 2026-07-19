import { motion } from "framer-motion";
import { HeroBackground } from "@raisen-marketing/components/background/HeroBackground";
import { HeroBadge } from "@raisen-marketing/components/hero/HeroBadge";
import { HeroTitle } from "@raisen-marketing/components/hero/HeroTitle";
import { HeroCTAs } from "@raisen-marketing/components/hero/HeroCTAs";
import { HeroStats } from "@raisen-marketing/components/hero/HeroStats";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// Hero: fondo animado + badge → título por palabras (gradiente en las palabras de `heroGradient`) → subtítulo → CTAs → stats.
export function MarketingHero({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: "var(--rm-bg-hero)" }}>
      <HeroBackground />
      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <div className="mb-8"><HeroBadge text={c.heroBadge} /></div>
        <HeroTitle text={c.heroTitle} gradient={c.heroGradient} />
        <motion.p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/60 md:text-xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.7 }}>{c.heroSubtitle}</motion.p>
        <div className="mt-10"><HeroCTAs primary={c.heroCtaPrimary} secondary={c.heroCtaSecondary} /></div>
        <div className="mt-16"><HeroStats stats={c.heroStats} /></div>
      </div>
    </section>
  );
}
