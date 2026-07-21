import { useScrollReveal } from "@raisen-marketing/hooks/useScrollReveal";
import { useMarketingProcess } from "@raisen-marketing/hooks/useMarketingProcess";
import { PROCESS_STEPS_FALLBACK, PROCESS_CONFIG_FALLBACK } from "@raisen-marketing/data/process-steps";
import { ProcessStepCard } from "@raisen-marketing/components/process/ProcessStepCard";
import type { Lang } from "@raisen-marketing/data/copy";

// Sección Proceso (réplica OMEGA): timeline vertical max-w-xl, reveal con stagger. Lee config+pasos de la
// DB (editable en /web/proceso) y cae al fallback si Supabase aún no responde o no hay pasos activos.
export function MarketingProcess({ lang }: { lang: Lang }) {
  const es = lang === "es";
  const { config, steps } = useMarketingProcess();
  const cfg = config ?? PROCESS_CONFIG_FALLBACK;
  const items = steps && steps.length ? steps : PROCESS_STEPS_FALLBACK;
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="process" aria-labelledby="process-title" ref={ref} className="relative overflow-hidden px-6 py-16 md:py-20">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-primary/[0.04] blur-[120px]" />
      <div className={`relative z-10 mx-auto max-w-3xl transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">{es ? cfg.eyebrowEs : cfg.eyebrowEn}</p>
          <h2 id="process-title" className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">{es ? cfg.titleEs : cfg.titleEn}</h2>
        </div>
        <div className="mx-auto max-w-xl">
          {items.map((s, i) => (
            <div key={s.id} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`} style={{ transitionDelay: `${300 + i * 180}ms` }}>
              <ProcessStepCard step={s} lang={lang} isLast={i === items.length - 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
