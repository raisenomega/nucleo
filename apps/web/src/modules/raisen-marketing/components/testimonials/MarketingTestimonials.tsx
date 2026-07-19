import { motion } from "framer-motion";
import { TESTIMONIALS } from "@raisen-marketing/data/testimonials";
import { TestimonialCard } from "@raisen-marketing/components/testimonials/TestimonialCard";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// Sección Testimonios: eyebrow + H2 + grid 3 cards.
export function MarketingTestimonials({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  return (
    <section id="testimonios" className="mx-auto max-w-6xl px-6 py-32">
      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <p className="text-sm font-medium uppercase tracking-widest text-violet-400">{c.testimonialsEyebrow}</p>
        <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">{c.testimonialsTitle}</h2>
      </motion.div>
      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((tm, i) => <TestimonialCard key={tm.name} item={tm} index={i} lang={lang} />)}
      </div>
    </section>
  );
}
