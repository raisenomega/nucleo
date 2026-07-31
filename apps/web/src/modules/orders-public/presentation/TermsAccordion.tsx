import { useState } from "react";
import { useI18n } from "@shared/i18n";

// Renderiza texto con **negrita** (markdown mínimo, sin HTML crudo = seguro) en un acordeón expandible.
function renderLine(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>);
}

export function TermsAccordion({ terms }: { terms: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!terms) return null;
  return (
    <div className="rounded-lg border border-border">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex w-full items-center justify-between p-2 text-xs font-bold text-foreground">
        {t("offTermsTitle")}<span>{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="max-h-64 space-y-1.5 overflow-y-auto border-t border-border p-3 text-xs leading-relaxed text-muted-foreground">
          {terms.split("\n").map((line, i) => (line.trim() === "" ? <div key={i} className="h-1.5" /> : <p key={i}>{renderLine(line)}</p>))}
        </div>
      )}
    </div>
  );
}
