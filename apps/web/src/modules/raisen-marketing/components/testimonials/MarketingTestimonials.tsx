import { useScrollReveal } from "@raisen-marketing/hooks/useScrollReveal";
import { useMarketingTestimonials } from "@raisen-marketing/hooks/useMarketingTestimonials";
import { TESTIMONIALS_FALLBACK, TESTIMONIALS_CONFIG_FALLBACK } from "@raisen-marketing/data/testimonials";
import { TestimonialCard } from "@raisen-marketing/components/testimonials/TestimonialCard";
import type { Lang } from "@raisen-marketing/data/copy";

// Sección Prueba Social (réplica OMEGA): header reveal + grid de cards. Lee config+testimonios de la DB
// (editable en /web/testimonios) y cae al fallback si Supabase aún no responde o no hay activos.
export function MarketingTestimonials({ lang }: { lang: Lang }) {
  const es = lang === "es";
  const { config, testimonials } = useMarketingTestimonials();
  const cfg = config ?? TESTIMONIALS_CONFIG_FALLBACK;
  const items = testimonials && testimonials.length ? testimonials : TESTIMONIALS_FALLBACK;
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="social_proof" ref={ref} className="relative px-6 py-16 md:py-20">
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className={`mb-16 text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">{es ? cfg.eyebrowEs : cfg.eyebrowEn}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">{es ? cfg.titleEs : cfg.titleEn}</h2>
        </div>
        <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => <TestimonialCard key={t.id} item={t} lang={lang} />)}
        </div>
      </div>
    </section>
  );
}
