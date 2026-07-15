import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { SpFaq } from "@landing-public/domain/service-page.types";

// Acordeón FAQ agrupado por categoría (Básicos/Avanzados). El JSON-LD FAQPage lo inyecta useServicePageSeo.
export function ServiceFaqAccordion({ faq }: { faq: SpFaq[] }) {
  const { locale } = useI18n();
  const en = locale === "en";
  const [open, setOpen] = useState<number | null>(null);
  if (!faq?.length) return null;
  const cats: { name: string; items: { f: SpFaq; idx: number }[] }[] = [];
  faq.forEach((f, idx) => {
    const name = en ? f.category_en : f.category_es;
    let g = cats.find((c) => c.name === name);
    if (!g) { g = { name, items: [] }; cats.push(g); }
    g.items.push({ f, idx });
  });
  return (
    <section id="faq-hydro-jet" className="mx-auto max-w-3xl px-6 py-12">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 text-center font-bold">{en ? "Frequently asked questions" : "Preguntas frecuentes"}</h2>
      {cats.map((c) => (
        <div key={c.name} className="mb-6">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[color:hsl(var(--lp-muted))]">{c.name}</h3>
          <div className="space-y-2">
            {c.items.map(({ f, idx }) => (
              <div key={idx} className="rounded-lg border border-border">
                <button type="button" aria-expanded={open === idx} onClick={() => setOpen(open === idx ? null : idx)} className="flex w-full items-center justify-between gap-3 p-4 text-left font-medium text-foreground">
                  {en ? f.question_en : f.question_es}
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open === idx ? "rotate-180" : ""}`} />
                </button>
                {open === idx && <p className="px-4 pb-4 text-sm text-[color:hsl(var(--lp-muted))]">{en ? f.answer_en : f.answer_es}</p>}
              </div>))}
          </div>
        </div>))}
    </section>
  );
}
