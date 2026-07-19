import { Quote } from "lucide-react";
import type { Testimonial } from "@raisen-marketing/data/testimonials";
import type { Lang } from "@raisen-marketing/data/copy";

// Tarjeta de testimonio (réplica OMEGA · quote + name + company · card oscura glass, quote dorada).
export function TestimonialCard({ item, lang }: { item: Testimonial; lang: Lang }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
      <Quote className="mb-4 h-6 w-6 text-primary" />
      <p className="flex-1 text-sm leading-relaxed text-white/80">{lang === "es" ? item.quoteEs : item.quoteEn}</p>
      <div className="mt-6">
        <p className="font-display text-sm font-semibold text-white">{item.name}</p>
        <p className="text-xs text-white/50">{item.company}</p>
      </div>
    </div>
  );
}
