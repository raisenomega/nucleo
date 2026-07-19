import { motion } from "framer-motion";
import { HeroBackground } from "@raisen-marketing/components/background/HeroBackground";
import { HeroBadge } from "@raisen-marketing/components/hero/HeroBadge";
import { HeroTitle } from "@raisen-marketing/components/hero/HeroTitle";
import { HeroCTAs } from "@raisen-marketing/components/hero/HeroCTAs";
import { HeroStats } from "@raisen-marketing/components/hero/HeroStats";

const BADGE = "Nuevo · Plataforma operacional con IA para negocios de servicio";
const TITLE = "Opera tu negocio completo desde un solo lugar";
const SUBTITLE = "Facturación, rutas, empleados, impuestos, landing y agentes IA — todo integrado bajo tu marca. NÚCLEO es el sistema operativo que tu negocio de servicio necesita.";
const STATS = [
  { value: "6+", label: "módulos integrados" },
  { value: "100%", label: "white-label" },
  { value: "PR", label: "compliance fiscal" },
];

// Hero: fondo animado + badge → título animado por palabras → subtítulo → CTAs → stats. "un solo lugar" (5,6,7) en gradiente.
export function MarketingHero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: "var(--rm-bg-hero)" }}>
      <HeroBackground />
      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <div className="mb-8"><HeroBadge text={BADGE} /></div>
        <HeroTitle text={TITLE} gradient={[5, 6, 7]} />
        <motion.p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/60 md:text-xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.7 }}>{SUBTITLE}</motion.p>
        <div className="mt-10"><HeroCTAs primary="Solicitar acceso →" secondary="Ver demo ↗" /></div>
        <div className="mt-16"><HeroStats stats={STATS} /></div>
      </div>
    </section>
  );
}
