import { motion, useScroll, useTransform } from "framer-motion";

const LINKS = [{ label: "Producto", id: "features" }, { label: "Precios", id: "pricing" }];
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

// Navbar fija glass scroll-reactive: fondo y blur transicionan con el scroll (useScroll → useTransform).
export function MarketingNav() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ["rgba(10,10,15,0)", "rgba(10,10,15,0.8)"]);
  const blur = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(20px)"]);
  return (
    <motion.nav style={{ background: bg, backdropFilter: blur, WebkitBackdropFilter: blur }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-white">NÚCLEO<span className="text-violet-400">.</span></span>
        <div className="hidden gap-8 md:flex">
          {LINKS.map((l) => (
            <button key={l.id} type="button" onClick={() => scrollTo(l.id)}
              className="text-sm text-white/60 transition-colors hover:text-white">{l.label}</button>
          ))}
        </div>
        <button type="button" onClick={() => scrollTo("lead-form")}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-all hover:bg-white/90">Solicitar acceso</button>
      </div>
    </motion.nav>
  );
}
