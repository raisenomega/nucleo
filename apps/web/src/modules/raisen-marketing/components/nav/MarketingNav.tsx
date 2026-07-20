import { COPY, type Lang } from "@raisen-marketing/data/copy";

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

// Header de la landing (réplica OMEGA LandingHeader): glass fixed, logo NÚCLEO. (punto dorado), links,
// toggle ES/EN, CTA dorado. Landing DARK-ONLY → SIN toggle de tema (sol/luna). Orden derecha: idioma → CTA,
// con shrink-0/nowrap para que nada se solape (bug del navbar viejo). Scroll-a-sección (single-page).
export function MarketingNav({ lang, toggleLang }: { lang: Lang; toggleLang: () => void }) {
  const c = COPY[lang];
  const links = [{ label: c.navProduct, id: "services" }, { label: c.navPricing, id: "pricing" }, { label: c.navContact, id: "lead-form" }];
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-background/40 px-6 py-4 backdrop-blur-sm md:px-12">
      <button type="button" onClick={() => scrollTo("hero")} className="shrink-0 font-display text-lg font-bold tracking-tight text-white">
        NÚCLEO<span className="text-primary">.</span>
      </button>
      <div className="hidden gap-8 md:flex">
        {links.map((l) => (
          <button key={l.id} type="button" onClick={() => scrollTo(l.id)} className="text-sm text-white/60 transition-colors hover:text-white">{l.label}</button>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button type="button" onClick={toggleLang} aria-label="idioma" className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70 transition-colors hover:text-white">{lang === "es" ? "EN" : "ES"}</button>
        <button type="button" onClick={() => scrollTo("lead-form")} className="shrink-0 whitespace-nowrap rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:scale-105">{c.navCta}</button>
      </div>
    </header>
  );
}
