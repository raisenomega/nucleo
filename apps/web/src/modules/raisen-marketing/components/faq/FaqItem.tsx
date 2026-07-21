import { ChevronDown } from "lucide-react";
import type { FaqRow } from "@raisen-marketing/data/faq.types";
import type { Lang } from "@raisen-marketing/data/copy";

// Una pregunta del acordeón. Disclosure CONTROLADO (no <details>) para poder cerrar las demás al abrir una
// y animar el chevron. El contenido se monta solo al abrir; el aria-controls/aria-expanded mantiene la
// semántica que necesitan lectores de pantalla.
export function FaqItem({ faq, lang, open, onToggle }: { faq: FaqRow; lang: Lang; open: boolean; onToggle: () => void }) {
  const es = lang === "es";
  const panelId = `faq-panel-${faq.id}`;
  return (
    <div className="border-b border-border/30">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-primary">
        <span className="font-display text-lg font-semibold text-foreground">{es ? faq.questionEs : faq.questionEn}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p id={panelId} className="pb-5 pr-9 text-sm leading-relaxed text-muted-foreground">
          {es ? faq.answerEs : faq.answerEn}
        </p>
      )}
    </div>
  );
}
