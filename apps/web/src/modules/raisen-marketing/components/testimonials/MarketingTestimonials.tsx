import { useScrollReveal } from "@raisen-marketing/hooks/useScrollReveal";
import { TESTIMONIALS } from "@raisen-marketing/data/testimonials";
import { TestimonialCard } from "@raisen-marketing/components/testimonials/TestimonialCard";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// Sección Prueba Social (réplica OMEGA): header reveal + grid de 3 cards.
export function MarketingTestimonials({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="social_proof" ref={ref} className="relative px-6 py-16 md:py-20">
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className={`mb-16 text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">{c.testimonialsTitle}</h2>
          <p className="mx-auto max-w-lg text-muted-foreground">{c.testimonialsSubtitle}</p>
        </div>
        <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => <TestimonialCard key={t.name} item={t} lang={lang} />)}
        </div>
      </div>
    </section>
  );
}
