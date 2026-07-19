import { Check, ArrowRight } from "lucide-react";
import type { Solution, Audience } from "@raisen-marketing/data/solutions";
import type { Lang } from "@raisen-marketing/data/copy";

// Bloque de "Soluciones" de OMEGA (eyebrow + título + bullets con check dorado + CTA). `highlight` → borde/glow
// dorado + badge (destaca el agente contable). El CTA hace scroll al #lead-form con la audience pre-marcada.
export function SolutionBlock({ block, lang, badge, onCta }: { block: Solution; lang: Lang; badge: string; onCta: (a: Audience) => void }) {
  const es = lang === "es";
  const bullets = es ? block.bulletsEs : block.bulletsEn;
  const border = block.highlight ? "border-primary/40 shadow-lg shadow-primary/10" : "border-border";
  return (
    <div className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-8 md:p-10 ${border}`}>
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      {block.highlight && <span className="absolute right-6 top-6 z-10 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">{badge}</span>}
      <div className="relative z-10 flex flex-1 flex-col">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{es ? block.eyebrowEs : block.eyebrowEn}</p>
        <h3 className="font-display text-2xl font-bold leading-tight text-foreground md:text-3xl">{es ? block.titleEs : block.titleEn}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{es ? block.subtitleEs : block.subtitleEn}</p>
        <ul className="mt-6 flex-1 space-y-3">
          {bullets.map((b) => <li key={b} className="flex items-start gap-2.5 text-sm text-foreground"><Check size={18} className="mt-0.5 shrink-0 text-primary" />{b}</li>)}
        </ul>
        <button type="button" onClick={() => onCta(block.audience)} className="mt-8 inline-flex items-center gap-2 self-start rounded-full bg-primary px-6 py-3 font-display text-sm font-semibold text-primary-foreground transition-transform hover:scale-105">
          {es ? block.ctaEs : block.ctaEn} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
