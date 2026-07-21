import { ArrowDown } from "lucide-react";
import { COPY, type Lang } from "@raisen-marketing/data/copy";
import type { MarketingHeroRow } from "@raisen-marketing/data/hero.types";

// Hero foreground (z-10) · réplica OMEGA HeroSection. Lee de marketing_hero (fallback al copy mientras carga).
export function MarketingHero({ lang, hero }: { lang: Lang; hero: MarketingHeroRow | null }) {
  const c = COPY[lang];
  const es = lang === "es";
  const title = hero ? (es ? hero.titleEs : hero.titleEn) : c.heroTitle;
  const subtitle = hero ? (es ? hero.subtitleEs : hero.subtitleEn) : c.heroSubtitle;
  const cta = hero ? (es ? hero.ctaLabelEs : hero.ctaLabelEn) : c.heroCta;
  const scroll = hero?.scrollText ?? c.heroScroll;
  const href = hero?.ctaHref ?? "#lead-form";
  const onCta = () => { if (href.startsWith("#")) document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" }); else window.location.assign(href); };
  return (
    <section id="hero" aria-labelledby="hero-title" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        <h1 id="hero-title" className="animate-fade-up font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">{title}</h1>
        <p className="mx-auto max-w-2xl animate-fade-up text-base leading-relaxed text-white/70 sm:text-lg" style={{ animationDelay: "150ms" }}>{subtitle}</p>
        <div className="animate-fade-up pt-2" style={{ animationDelay: "300ms" }}>
          <button type="button" onClick={onCta} className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 font-display text-base font-semibold text-primary-foreground transition-transform hover:scale-105">{cta}</button>
        </div>
      </div>
      {(hero?.showScrollIndicator ?? true) && (
        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 animate-fade-up" style={{ animationDelay: "800ms" }}>
          <span className="text-xs text-muted-foreground">{scroll}</span>
          <ArrowDown size={16} className="animate-bounce text-primary" />
        </div>
      )}
    </section>
  );
}
