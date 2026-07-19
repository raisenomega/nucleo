import type { Step } from "@raisen-marketing/data/process-steps";
import type { Lang } from "@raisen-marketing/data/copy";

// Réplica del ProcessStepCard de OMEGA: círculo de ícono + línea conectora + número "01/02" + título + desc.
// El "encendido" del molde se preserva como hover (mismo `lit` dorado). Dorado = dorado (token primary) (tema .rm-root).
export function ProcessStepCard({ step, lang, isLast }: { step: Step; lang: Lang; isLast: boolean }) {
  const Icon = step.icon;
  return (
    <div className="group relative flex gap-6">
      {!isLast && <div className="absolute left-5 top-12 h-full w-px bg-border" />}
      <div className="relative z-10 shrink-0">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-background text-primary transition-all duration-500 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_16px_4px_hsl(var(--primary)/0.4)]">
          <Icon size={18} />
        </div>
      </div>
      <div className="flex-1 pb-12">
        <p className="mb-1 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">{String(step.number).padStart(2, "0")}</p>
        <h3 className="font-display text-lg font-bold text-foreground">{lang === "es" ? step.titleEs : step.titleEn}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lang === "es" ? step.descEs : step.descEn}</p>
      </div>
    </div>
  );
}
