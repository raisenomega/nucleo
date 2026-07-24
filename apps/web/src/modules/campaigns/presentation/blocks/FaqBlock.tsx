import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { BlockContent } from "@campaigns/domain/campaign.types";

type Q = { question?: string; answer?: string };

// Acordeón de FAQ (disclosure controlado, sin librería). Solo uno abierto a la vez.
export function FaqBlock({ content }: { content: BlockContent }) {
  const items = (Array.isArray(content.items) ? content.items : []) as Q[];
  const [open, setOpen] = useState<number | null>(null);
  if (items.length === 0) return null;
  return (
    <section className="camp-faq">
      {items.map((q, i) => (
        <div key={i} className="camp-faq-item">
          <button type="button" className="camp-faq-q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
            <span>{q.question}</span><ChevronDown className={`camp-faq-ic ${open === i ? "camp-faq-ic-open" : ""}`} />
          </button>
          {open === i && <p className="camp-faq-a">{q.answer}</p>}
        </div>
      ))}
    </section>
  );
}
