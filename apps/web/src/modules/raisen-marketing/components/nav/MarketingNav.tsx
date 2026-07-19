import { motion, useScroll, useTransform } from "framer-motion";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

// Navbar fija glass scroll-reactive (useScroll → fondo/blur) + toggle de idioma ES↔EN.
export function MarketingNav({ lang, toggleLang }: { lang: Lang; toggleLang: () => void }) {
  const c = COPY[lang];
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ["rgba(10,10,15,0)", "rgba(10,10,15,0.8)"]);
  const blur = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(20px)"]);
  const links = [{ label: c.navProduct, id: "features" }, { label: c.navPricing, id: "precios" }];
  return (
    <motion.nav style={{ background: bg, backdropFilter: blur, WebkitBackdropFilter: blur }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-white">NÚCLEO<span className="text-violet-400">.</span></span>
        <div className="hidden gap-8 md:flex">
          {links.map((l) => (
            <button key={l.id} type="button" onClick={() => scrollTo(l.id)}
              className="text-sm text-white/60 transition-colors hover:text-white">{l.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleLang}
            className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70 transition-colors hover:text-white">{lang === "es" ? "EN" : "ES"}</button>
          <button type="button" onClick={() => scrollTo("lead-form")}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-all hover:bg-white/90">{c.navCta}</button>
        </div>
      </div>
    </motion.nav>
  );
}
