import { motion } from "framer-motion";
import { STEPS } from "@raisen-marketing/data/process-steps";
import { ProcessStepCard } from "@raisen-marketing/components/process/ProcessStepCard";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// Sección Proceso (timeline vertical, 4 pasos con línea conectora). max-w-xl centrado.
export function MarketingProcess({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  return (
    <section id="proceso" className="px-6 py-32">
      <div className="mx-auto max-w-xl">
        <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="text-sm font-medium uppercase tracking-widest text-violet-400">{c.processEyebrow}</p>
          <h2 className="mb-16 mt-4 text-center text-4xl font-bold text-white md:text-5xl">{c.processTitle}</h2>
        </motion.div>
        {STEPS.map((s, i) => <ProcessStepCard key={s.number} step={s} index={i} lang={lang} last={i === STEPS.length - 1} />)}
      </div>
    </section>
  );
}
