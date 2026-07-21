import { useState } from "react";
import { useScrollReveal } from "@raisen-marketing/hooks/useScrollReveal";
import { useMarketingFaqs } from "@raisen-marketing/hooks/useMarketingFaqs";
import { FAQ_CONFIG_FALLBACK, FAQS_FALLBACK } from "@raisen-marketing/data/faqs-fallback";
import { FaqItem } from "@raisen-marketing/components/faq/FaqItem";
import type { FaqRow } from "@raisen-marketing/data/faq.types";
import type { Lang } from "@raisen-marketing/data/copy";

// Sección Preguntas frecuentes. Contenedor más estrecho que el resto (max-w-3xl): son bloques de texto, no
// tarjetas. Es la MISMA fuente que alimenta el JSON-LD FAQPage, así el structured data siempre corresponde
// a contenido visible (requisito de Google).
export function MarketingFAQ({ lang, initialFaqs }: { lang: Lang; initialFaqs?: FaqRow[] | null }) {
  const es = lang === "es";
  const { config, faqs } = useMarketingFaqs(initialFaqs);
  const cfg = config ?? FAQ_CONFIG_FALLBACK;
  const items = faqs && faqs.length ? faqs : FAQS_FALLBACK;
  const [open, setOpen] = useState<string | null>(null);
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="faq" aria-labelledby="faq-title" ref={ref} className="relative overflow-hidden px-6 py-16 md:py-20">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className={`relative z-10 mx-auto max-w-3xl transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">{es ? cfg.eyebrowEs : cfg.eyebrowEn}</p>
          <h2 id="faq-title" className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">{es ? cfg.titleEs : cfg.titleEn}</h2>
        </div>
        <div>
          {items.map((f) => (
            <FaqItem key={f.id} faq={f} lang={lang} open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}
