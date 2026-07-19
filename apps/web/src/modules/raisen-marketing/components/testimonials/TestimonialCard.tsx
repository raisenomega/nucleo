import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import type { Testimonial } from "@raisen-marketing/data/testimonials";
import type { Lang } from "@raisen-marketing/data/copy";

const hue = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };
const initials = (n: string) => n.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();

// Card de testimonio (glass): quote itálica + avatar iniciales (color HSL por hash del nombre) + estrellas.
export function TestimonialCard({ item, index, lang }: { item: Testimonial; index: number; lang: Lang }) {
  return (
    <motion.div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-sm"
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }}>
      <Quote className="h-6 w-6 text-violet-400/30" />
      <p className="mt-3 text-sm italic leading-relaxed text-white/80">{lang === "es" ? item.quoteEs : item.quoteEn}</p>
      <div className="mt-6 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: `hsl(${hue(item.name)} 60% 45%)` }}>{initials(item.name)}</span>
        <div>
          <div className="text-sm font-semibold text-white">{item.name}</div>
          <div className="text-xs text-white/40">{item.company}</div>
        </div>
      </div>
      <div className="mt-4 flex gap-0.5">
        {Array.from({ length: item.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-violet-400 text-violet-400" />)}
      </div>
    </motion.div>
  );
}
