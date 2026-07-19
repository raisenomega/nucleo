import { motion } from "framer-motion";
import { FEATURES } from "@raisen-marketing/data/features";
import { FeatureCard } from "@raisen-marketing/components/features/FeatureCard";

// Sección Features (bento grid): eyebrow + H2 + grid 3 col con cards span 1/2, stagger delay i*0.08.
export function MarketingFeatures() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-32">
      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <p className="text-sm font-medium uppercase tracking-widest text-violet-400">PLATAFORMA</p>
        <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">Todo lo que NÚCLEO hace por tu negocio</h2>
      </motion.div>
      <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURES.map((f, i) => <FeatureCard key={f.titleEs} feature={f} index={i} />)}
      </div>
    </section>
  );
}
