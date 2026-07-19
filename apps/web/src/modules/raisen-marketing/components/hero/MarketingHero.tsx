import { ArrowDown } from "lucide-react";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

const scrollToForm = () => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });

// Hero foreground (z-10) · renderiza SIN esperar al Canvas 3D (detrás, z-0). Réplica OMEGA HeroSection:
// título + subtítulo + CTA dorado + indicador "scroll". Delays fade-up 0/150/300/800ms. SIN badge/stats.
export function MarketingHero({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  return (
    <section id="hero" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        <h1 className="animate-fade-up font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">{c.heroTitle}</h1>
        <p className="mx-auto max-w-2xl animate-fade-up text-base leading-relaxed text-white/70 sm:text-lg" style={{ animationDelay: "150ms" }}>{c.heroSubtitle}</p>
        <div className="animate-fade-up pt-2" style={{ animationDelay: "300ms" }}>
          <button type="button" onClick={scrollToForm} className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 font-display text-base font-semibold text-primary-foreground transition-transform hover:scale-105">{c.heroCta}</button>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 animate-fade-up" style={{ animationDelay: "800ms" }}>
        <span className="text-xs text-muted-foreground">{c.heroScroll}</span>
        <ArrowDown size={16} className="animate-bounce text-primary" />
      </div>
    </section>
  );
}
