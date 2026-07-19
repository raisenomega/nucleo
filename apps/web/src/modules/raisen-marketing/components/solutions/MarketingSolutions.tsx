import { useScrollReveal } from "@raisen-marketing/hooks/useScrollReveal";
import { SOLUTIONS, type Audience } from "@raisen-marketing/data/solutions";
import { SolutionBlock } from "@raisen-marketing/components/solutions/SolutionBlock";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// Sección "Soluciones que escalan contigo" (réplica OMEGA): 2 bloques. onCta pre-marca la pill del lead form.
export function MarketingSolutions({ lang, onCta }: { lang: Lang; onCta: (a: Audience) => void }) {
  const c = COPY[lang];
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="solutions" ref={ref} className="relative overflow-hidden px-6 py-16 md:py-20">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className={`relative z-10 mx-auto max-w-5xl transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">{c.solutionsTitle}</h2>
          <p className="mx-auto max-w-lg text-muted-foreground">{c.solutionsSubtitle}</p>
        </div>
        <div className="grid items-stretch gap-6 md:grid-cols-2">
          {SOLUTIONS.map((s, i) => <SolutionBlock key={i} block={s} lang={lang} badge={c.solutionsBadge} onCta={onCta} />)}
        </div>
      </div>
    </section>
  );
}
