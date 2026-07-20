import { useScrollReveal } from "@raisen-marketing/hooks/useScrollReveal";
import { useMarketingSolutions } from "@raisen-marketing/hooks/useMarketingSolutions";
import { SOLUTIONS_FALLBACK, SOLUTIONS_CONFIG_FALLBACK, type Audience } from "@raisen-marketing/data/solutions";
import { SolutionBlock } from "@raisen-marketing/components/solutions/SolutionBlock";
import type { Lang } from "@raisen-marketing/data/copy";

// Sección "Soluciones que escalan contigo" (réplica OMEGA): grid 2x2 de bloques. Lee config+bloques de la DB
// (editable en /web/soluciones) y cae al fallback. setAudience pre-marca la pill del lead form según pill_preset.
export function MarketingSolutions({ lang, setAudience }: { lang: Lang; setAudience: (a: Audience) => void }) {
  const es = lang === "es";
  const { config, solutions } = useMarketingSolutions();
  const cfg = config ?? SOLUTIONS_CONFIG_FALLBACK;
  const items = solutions && solutions.length ? solutions : SOLUTIONS_FALLBACK;
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="solutions" ref={ref} className="relative overflow-hidden px-6 py-16 md:py-20">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className={`relative z-10 mx-auto max-w-5xl transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">{es ? cfg.eyebrowEs : cfg.eyebrowEn}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">{es ? cfg.titleEs : cfg.titleEn}</h2>
        </div>
        <div className="grid items-stretch gap-6 md:grid-cols-2">
          {items.map((s) => <SolutionBlock key={s.id} block={s} lang={lang} setAudience={setAudience} />)}
        </div>
      </div>
    </section>
  );
}
