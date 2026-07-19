import { useScrollReveal } from "@raisen-marketing/hooks/useScrollReveal";
import { FEATURES } from "@raisen-marketing/data/features";
import { ServiceCard } from "@raisen-marketing/components/features/ServiceCard";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// Sección Servicios (réplica OMEGA): divisor+glow dorado, header reveal, grid de 4 cards.
export function MarketingFeatures({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="services" ref={ref} className="relative overflow-hidden px-6 py-16 md:py-20">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0"><div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/[0.03] blur-[150px]" /></div>
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className={`mb-16 text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">{c.featuresTitle}</h2>
          <p className="mx-auto max-w-lg text-muted-foreground">{c.featuresSubtitle}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => <ServiceCard key={f.titleEs} feature={f} lang={lang} index={i} isVisible={isVisible} />)}
        </div>
      </div>
    </section>
  );
}
