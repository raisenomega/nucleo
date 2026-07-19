import { useScrollReveal } from "@raisen-marketing/hooks/useScrollReveal";
import { STEPS } from "@raisen-marketing/data/process-steps";
import { ProcessStepCard } from "@raisen-marketing/components/process/ProcessStepCard";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// Sección Proceso (réplica OMEGA): timeline vertical max-w-xl, reveal con stagger por paso.
export function MarketingProcess({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="process" ref={ref} className="relative overflow-hidden px-6 py-16 md:py-20">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-primary/[0.04] blur-[120px]" />
      <div className={`relative z-10 mx-auto max-w-3xl transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">{c.processTitle}</h2>
          <p className="text-muted-foreground">{c.processSubtitle}</p>
        </div>
        <div className="mx-auto max-w-xl">
          {STEPS.map((s, i) => (
            <div key={s.number} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`} style={{ transitionDelay: `${300 + i * 180}ms` }}>
              <ProcessStepCard step={s} lang={lang} isLast={i === STEPS.length - 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
